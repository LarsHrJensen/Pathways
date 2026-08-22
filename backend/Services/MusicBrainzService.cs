using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using backend.Models;
using System.Reflection.Metadata;
using Microsoft.AspNetCore.Http.HttpResults;
using System.Security.Claims;

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

            result.Add(new ArtistRelation
            {
                ArtistId = artistId!,
                ArtistName = artistName!,
                RelationType = relationType!
            });
        }

        return result
            .GroupBy(r => new { r.ArtistId, r.RelationType})
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

    

}