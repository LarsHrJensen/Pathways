using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using backend.Models;
using System.Reflection.Metadata;
using Microsoft.AspNetCore.Http.HttpResults;
using System.Security.Claims;
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

        var occupationIds = GetEntityIds(claims, "P106");

        return new WikidataArtistHoverInfoDto
        {
            LifeSpan = lifeSpan,
            Occupations = occupationIds
        };

       // return string.Join(", ", occupationIds);
       //return lifeSpan;
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
}

