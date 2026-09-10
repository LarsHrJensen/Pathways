using System.Text.Json;
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

        return result
            .GroupBy(r => new { r.ArtistId, r.RelationType })
            .Select(g => g.First())
            .ToList();
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
        var searchResults = new List<SearchResult>
        {
            new SearchResult
            {
                Id = "1",
                Name = "Brian Eno",
                Type = "Person"
            },
            new SearchResult
            {
                Id = "2",
                Name = "David Bowie",
                Type = "Person"
            },
            new SearchResult
            {
                Id = "3",
                Name = "Roxy Music",
                Type = "Band"
            },
            new SearchResult
            {
                Id = "4",
                Name = "Nirvana",
                Type = "Band"
            },
            new SearchResult
            {
                Id = "5",
                Name = "Steve Albini",
                Type = "Person"
            },
            new SearchResult
            {
                Id = "6",
                Name = "Talking Heads",
                Type = "Band"
            },
            new SearchResult
            {
                Id = "7",
                Name = "David Byrne",
                Type = "Person"
            },
            new SearchResult
            {
                Id = "8",
                Name = "Another Green World",
                Type = "Album"
            },
            new SearchResult
            {
                Id = "9",
                Name = "Low",
                Type = "Album"
            },
            new SearchResult
            {
                Id = "10",
                Name = "Low",
                Type = "Band"
            },
            new SearchResult
            {
                Id = "11",
                Name = "Nevermind",
                Type = "Album"
            },
            new SearchResult
            {
                Id = "12",
                Name = "Nevermind",
                Type = "Tribute"
            }
        };

        var filteredResults = searchResults
            .Where(result => 
                result.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return filteredResults;
    }

}