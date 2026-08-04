using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;

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

    public async Task<string> SearchArtistAsync(string artist)
    {
        var url = $"https://musicbrainz.org/ws/2/artist/?query={artist}&fmt=json";

        var json = await _httpClient.GetStringAsync(url);

        using var document = JsonDocument.Parse(json);

        var artists = document.RootElement.GetProperty("artists");

        var firstArtist = artists[0];

        return firstArtist.GetProperty("name").GetString()!;
    }

}