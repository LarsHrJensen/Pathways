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

        var producerRelations = relations
            .EnumerateArray()
            .Where(relation =>
                relation.GetProperty("type").GetString() == "producer");

        Console.WriteLine("=== SATELLITE OF LOVE ===");

        foreach (var relation in producerRelations)
        {
            var recording = relation.GetProperty("recording");
            var title = recording.GetProperty("title").GetString();

            if (title != null &&
                title.Contains("Satellite of Love",
                    StringComparison.OrdinalIgnoreCase))
            {
                var id = recording.GetProperty("id").GetString();

                Console.WriteLine($"{title} -> {id}");
            }
        }

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

public async Task GetReleaseGroupReleasesAsync(string releaseMbid)
{
    var url =
    $"https://musicbrainz.org/ws/2/release/{releaseMbid}?inc=artist-rels+label-rels+recording-rels+work-rels&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

    using var document = JsonDocument.Parse(json);

    var relations = document.RootElement.GetProperty("relations");

    Console.WriteLine("=== RELEASE -> ARTIST RELATIONS ===");

    var relationTypes = relations
        .EnumerateArray()
        .Select(relation => relation.GetProperty("type").GetString())
        .Where(type => type != null)
        .GroupBy(type => type)
        .OrderBy(group => group.Key);

    Console.WriteLine("=== RELEASE RELATION TYPES ===");

    foreach (var group in relationTypes)
    {
        Console.WriteLine($"{group.Key}: {group.Count()}");
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

    // Album 
    public async Task<List<Album>> GetArtistAlbumsAsync(string mbid)
    {
        var url =
            $"https://musicbrainz.org/ws/2/release-group?artist={mbid}&type=album&limit=100&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var releaseGroups = document
            .RootElement
            .GetProperty("release-groups");

        var albums = new List<Album>();

        foreach (var releaseGroup in releaseGroups.EnumerateArray())
        {
            var secondaryTypes = releaseGroup
                .GetProperty("secondary-types")
                .EnumerateArray()
                .Select(type => type.GetString())
                .Where(type => type != null)
                .ToList();

            var excludedTypes = new[]
            {
                "Compilation",
                "Live",
                "Soundtrack"
            };

            var shouldExclude = secondaryTypes
                .Any(type => excludedTypes.Contains(type));

            if (shouldExclude)
            {
                continue;
            }

            albums.Add(new Album
            {
                Id = releaseGroup.GetProperty("id").GetString(),
                Title = releaseGroup.GetProperty("title").GetString()
            });
        }

        return albums;
    }

    //Gets projects related to an artist
    public async Task<List<ArtistRelation>> GetArtistProjectRelationsAsync(string mbid)
    {
        var relations = await GetArtistRelationsAsync(mbid);

        var projectRelationTypes = new[]
        {
            "collaboration",
            "member of band",
            "supporting musician",
            "instrumental supporting musician"
        };

        var projectArtistTypes = new[]
        {
            "Group",
            "Orchestra"
        };

        return relations
            .Where(relation => 
                projectArtistTypes.Contains(relation.ArtistType) &&
                projectRelationTypes.Contains(relation.RelationType))
            .ToList();
    }

        // Gets members of a group/project
        public async Task<List<ArtistRelation>> GetGroupMemberRelationsAsync(string mbid)
    {
        var relations = await GetArtistRelationsAsync(mbid);

        return relations
            .Where(relation =>
                relation.RelationType == "member of band" &&
                relation.ArtistType == "Person")
            .ToList();
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

    //Search suggestions
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