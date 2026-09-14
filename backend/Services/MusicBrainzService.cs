using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Models;
using Microsoft.OpenApi;


namespace backend.Services;

public class MusicBrainzService
{
    private readonly HttpClient _httpClient;

    public MusicBrainzService(HttpClient httpClient)
    {
        _httpClient = httpClient;

        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(
       "Pathways/0.1 (https://github.com/LarsHrJensen/Pathways)");
    }

    public async Task<Artist> SearchArtistAsync(string artist)
    {

        var url = $"https://musicbrainz.org/ws/2/artist/?query={artist}&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var artists = document.RootElement.GetProperty("artists");
        var firstArtist = artists[0];

        var id = firstArtist.GetProperty("id").GetString();
        var name = firstArtist.GetProperty("name").GetString();

        return new Artist
        {
            Id = id!,
            Name = name!
        };

    }

    public async Task<List<ArtistRelation>> GetArtistRelationsAsync(string mbid)
    {
        var url = $"https://musicbrainz.org/ws/2/artist/{mbid}?inc=artist-rels&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        var result = new List<ArtistRelation>();

        using var document = JsonDocument.Parse(json);

        var relations = document.RootElement.GetProperty("relations");

        foreach (var relation in relations.EnumerateArray())
        {
            var artistId = relation.GetProperty("artist").GetProperty("id").GetString();
            var artistName = relation.GetProperty("artist").GetProperty("name").GetString();
            var relationType = relation.GetProperty("type").GetString();
            var artistType = relation.GetProperty("artist").GetProperty("type").GetString();

            result.Add(new ArtistRelation
            {
                ArtistId = artistId,
                ArtistName = artistName,
                RelationType = relationType,
                ArtistType = artistType
            });
        }

        var relationTypes = result
            .Select(r => r.RelationType)
            .Distinct()
            .OrderBy(type => type);

        Console.WriteLine("=== ARTIST RELATION TYPES ===");

        foreach (var type in relationTypes)
        {
            Console.WriteLine(type);
        }

        return result
            .GroupBy(r => new { r.ArtistId, r.RelationType })
            .Select(g => g.First())
            .ToList();
    }

    public async Task GetArtistRecordingRelationsAsync(string mbid)
    {
        var url =
            $"https://musicbrainz.org/ws/2/artist/{mbid}?inc=recording-rels&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var relations = document.RootElement.GetProperty("relations");

        Console.WriteLine("=== ARTIST -> RECORDING RELATIONS ===");

        var relationTypes = relations
            .EnumerateArray()
            .Select(relation => relation.GetProperty("type").GetString())
            .Where(type => type != null)
            .GroupBy(type => type)
            .OrderBy(group => group.Key);

        foreach (var group in relationTypes)
        {

            Console.WriteLine($"{group.Key}: {group.Count()}");
        }
    }

    public async Task GetArtistWorkRelationsAsync(string mbid)
    {
        var url =
            $"https://musicbrainz.org/ws/2/artist/{mbid}?inc=work-rels&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var relations = document.RootElement.GetProperty("relations");

        var workRelations = relations
            .EnumerateArray()
            .Select(relation => new
            {
                RelationType = relation.GetProperty("type").GetString(),
                WorkId = relation.GetProperty("work").GetProperty("id").GetString(),
                WorkTitle = relation.GetProperty("work").GetProperty("title").GetString()
            })
            .GroupBy(r => new { r.WorkId, r.WorkTitle })
            .Where(group => group.Count() > 1)
            .Take(20);

        Console.WriteLine("=== WORKS WITH MULTIPLE RELATION TYPES ===");

        foreach (var group in workRelations)
        {
            var types = group
                .Select(r => r.RelationType)
                .Distinct();

            Console.WriteLine(
                $"{group.Key.WorkTitle}: {string.Join(", ", types)}"
            );
        }
    }

    public async Task GetArtistReleaseRelationsAsync(string mbid)
    {
        var url =
            $"https://musicbrainz.org/ws/2/artist/{mbid}?inc=release-rels&fmt=json";
            

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var relations = document.RootElement.GetProperty("relations");

        var relationTypes = relations
            .EnumerateArray()
            .Select(relation => relation.GetProperty("type").GetString())
            .Where(type => type != null)
            .GroupBy(type => type)
            .OrderBy(group => group.Key);

        Console.WriteLine("=== ARTIST -> RELEASE RELATIONS ===");

        foreach (var group in relationTypes)
        {
            Console.WriteLine($"{group.Key}: {group.Count()}");
        }
    }

    public async Task GetArtistReleaseGroupRelationsAsync(string mbid)
    {
        var url =
            $"https://musicbrainz.org/ws/2/artist/{mbid}?inc=release-group-rels&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var relations = document.RootElement.GetProperty("relations");

        var relationTypes = relations
            .EnumerateArray()
            .Select(relation => relation.GetProperty("type").GetString())
            .Where(type => type != null)
            .GroupBy(type => type)
            .OrderBy(group => group.Key);

        Console.WriteLine("=== ARTIST -> RELEASE GROUP RELATIONS ===");

        foreach (var group in relationTypes)
        {
            Console.WriteLine($"{group.Key}: {group.Count()}");
        }
    }

    public async Task SearchRecordingAsync() //for test
    {
        var title = "Like a Rolling Stone";

        var url =
            $"https://musicbrainz.org/ws/2/recording/?query=recording:\"{Uri.EscapeDataString(title)}\"%20AND%20artist:\"Bob%20Dylan\"&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var recordings = document
            .RootElement
            .GetProperty("recordings");

        Console.WriteLine("=== RECORDING SEARCH RESULTS ===");

        foreach (var recording in recordings.EnumerateArray().Take(10))
        {
            var id = recording.GetProperty("id").GetString();
            var recordingTitle = recording.GetProperty("title").GetString();

            Console.WriteLine($"{recordingTitle} -> {id}");
        }
    }

        public async Task TestRecordingTraversalAsync(string recordingMbid)
    {
        var url =
            $"https://musicbrainz.org/ws/2/recording/{recordingMbid}?inc=artist-rels&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var relations = document
            .RootElement
            .GetProperty("relations");

        Console.WriteLine("=== ARTISTS ON RECORDING ===");

        foreach (var relation in relations.EnumerateArray())
        {
            if (!relation.TryGetProperty("artist", out var artist))
            {
                continue;
            }

            var artistName = artist.GetProperty("name").GetString();
            var relationType = relation.GetProperty("type").GetString();

            Console.WriteLine($"{artistName} -> {relationType}");
        }
    }
    public async Task<List<Relation>> GetReleaseRelationsAsync(string mbid)
    {
        var url = $"https://musicbrainz.org/ws/2/release/{mbid}?inc=artist-rels&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        var result = new List<Relation>();

        using var document = JsonDocument.Parse(json);

        var relations = document.RootElement.GetProperty("relations");

        foreach (var relation in relations.EnumerateArray())
        {
            var artist = relation.GetProperty("artist");

            var targetId = artist.GetProperty("id").GetString();
            var targetName = artist.GetProperty("name").GetString();
            var targetType = relation.GetProperty("target-type").GetString();
            var relationType = relation.GetProperty("type").GetString();

            result.Add(new Relation
            {
                TargetId = targetId!,
                TargetName = targetName!,
                TargetType = targetType!,
                RelationType = relationType!
            });
        }

        return result;
    }

    public async Task<string?> GetWikidataIdAsync(string mbid)
    {
        var url =
            $"https://musicbrainz.org/ws/2/artist/{mbid}?inc=url-rels&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        if (!document.RootElement.TryGetProperty(
            "relations",
            out var relations))
        {
            return null;
        }

        foreach (var relation in relations.EnumerateArray())
        {
            if (!relation.TryGetProperty("url", out var urlObject))
            {
                continue;
            }

            var resource = urlObject
                .GetProperty("resource")
                .GetString();

            if (resource is not null &&
                resource.Contains("wikidata.org/wiki/"))
            {
                return resource.Split('/').Last();
            }
        }

        return null;
    }

    public async Task<List<SearchResult>> GetSearchResultAsync(string query)
    {
        var url = $"https://musicbrainz.org/ws/2/artist/?query={query}&fmt=json&limit=5";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var artists = document.RootElement.GetProperty("artists");

        var searchResults = new List<SearchResult>();

        foreach (var artist in artists.EnumerateArray())
        {
            var artistId = artist.GetProperty("id").GetString();
            var artistName = artist.GetProperty("name").GetString();
            var artistType = artist.GetProperty("type").GetString();

            searchResults.Add(new SearchResult
            {
                Id = artistId,
                Name = artistName,
                Type = artistType

            });
        }

        return searchResults;
    }

}