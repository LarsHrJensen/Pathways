using System.Reflection.Metadata;
using System.Text.Json;
using backend.DTOs;

namespace backend.Services;

public class WikidataService
{
    private readonly HttpClient _httpClient;

    public WikidataService(HttpClient httpClient)
    {
        _httpClient = httpClient;

        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(
        "Pathways/0.1 (https://github.com/LarsHrJensen/Pathways)");
    }

    public async Task<WikidataArtistHoverInfoDto> GetWikidataArtistHoverInfoAsync(string wikidataId)
    {
        var url =
            $"https://www.wikidata.org/wiki/Special:EntityData/{wikidataId}.json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var claims = document.RootElement
            .GetProperty("entities")
            .GetProperty(wikidataId)
            .GetProperty("claims");

        var birthYear = GetYearClaim(claims, "P569");
        var deathYear = GetYearClaim(claims, "P570");

        var lifeSpan = deathYear is null
            ? $"{birthYear}-"
            : $"{birthYear}-{deathYear}";

        //Here comes data from Wikidata and is processed in various methods in this class
        var occupationIds = GetEntityIds(claims, "P106");
        var occupations = await GetEntityLabelsAsync(occupationIds);

        var genreIds = GetEntityIds(claims, "P136");
        var genres = await GetEntityLabelsAsync(genreIds);

        var memberOfIds = GetEntityIds(claims, "P463");
        var bandIds = await FilterBandsFromMemberOfAsync(memberOfIds);
        var bands = await GetEntityLabelsAsync(bandIds);

        var originIds = GetEntityIds(claims, "P27");
        var origins = await GetEntityLabelsAsync(originIds);

        var origin = origins.FirstOrDefault() ?? "";

        //Console.WriteLine(json);

        return new WikidataArtistHoverInfoDto
        {
            LifeSpan = lifeSpan,
            Occupations = occupations,
            Genres = genres,
            Bands = bands,
            Origin = origin
        };

    }

    //Helper to retrieve year as 4 digits only
    private int? GetYearClaim(JsonElement claims, string propertyId)
    {
        if(!claims.TryGetProperty(propertyId, out var property))
        {
            return null;
        }

        var dateString = property[0]
            .GetProperty("mainsnak")
            .GetProperty("datavalue")
            .GetProperty("value")
            .GetProperty("time")
            .GetString();

        if (dateString is null)
        {
            return null;
        }

        return DateTime.Parse(
            dateString.TrimStart('+')
        ).Year;
    }

    //Helper to retrieve occupation Id's
    private List<string> GetEntityIds(JsonElement claims, string propertyId)
    {
        var ids = new List<string>();

        if (!claims.TryGetProperty(propertyId, out var property))
        {
            return ids;
        }

        foreach (var statement in property.EnumerateArray())
        {
            var id = statement
                .GetProperty("mainsnak")
                .GetProperty("datavalue")
                .GetProperty("value")
                .GetProperty("id")
                .GetString();

            if (id is not null)
            {
                ids.Add(id);
            }
        }

        return ids;
    }

    //Helper to translate wikidata entity Ids to readable labels
    private async Task<List<string>> GetEntityLabelsAsync(List<string> entityIds)
    {   
        if (entityIds.Count == 0)
        {
            return new List<string>();
        }

        //This enables the Wikidata API to receive more Ids in one call (Q855091|Q177220|Q753110|...)
        var ids = string.Join("|", entityIds);

        var url =
            $"https://www.wikidata.org/w/api.php?action=wbgetentities&ids={ids}&props=labels&languages=en&format=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var entities = document.RootElement.GetProperty("entities");

        var labels = new List<string>();

        foreach (var entityId in entityIds)
        {
            if (entities
                .GetProperty(entityId)
                .GetProperty("labels")
                .TryGetProperty("en", out var label))
            {
                var value = label.GetProperty("value").GetString();
                
                if (value is not null)
                {
                    labels.Add(value);
                }
                
            }    
        }

        return labels;
    }

    //Helper to distinguish bands from other sort of memberships (e.g group of people which is irrelevant when wanting an overview)
    private async Task<List<string>> FilterBandsFromMemberOfAsync(List<string> entityIds)
    {
        if(entityIds.Count == 0)
        {
            return new List<string>();
        }

        var ids = string.Join("|", entityIds);

        var url = 
            $"https://www.wikidata.org/w/api.php?action=wbgetentities&ids={ids}&props=claims&format=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var entities = document.RootElement.GetProperty("entities");

        var bandsIds = new List<string>();

        foreach (var entityId in entityIds)
        {
            var entity = entities.GetProperty(entityId);

            if (!entity.TryGetProperty("claims", out var claims))
            {
                continue;
            }

            if (!claims.TryGetProperty("P31", out var instanceOfClaims))
            {
                continue;
            }

            foreach (var statement in instanceOfClaims.EnumerateArray())
            {
                var typeId = statement
                    .GetProperty("mainsnak")
                    .GetProperty("datavalue")
                    .GetProperty("value")
                    .GetProperty("id")
                    .GetString();

                if (typeId == "Q215380" || typeId == "Q5741069") //right now only two types of memships are shown: 'musical group' and 'rock band'
                {
                    bandsIds.Add(entityId);
                    break;
                }
            }
        }
        
        return bandsIds;
    }
    
}
 


