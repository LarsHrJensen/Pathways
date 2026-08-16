using Microsoft.AspNetCore.Mvc;
using backend.Services;
using System.Threading.Tasks;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MusicController : ControllerBase
{
    private readonly MusicBrainzService _musicBrainzService;

    public MusicController(MusicBrainzService musicBrainzService)
    {
        _musicBrainzService = musicBrainzService;
    }

    [HttpGet("{artist}")]
    public async Task<IActionResult> Get(string artist)
    {
        var result = await _musicBrainzService.SearchArtistAsync(artist);

        return Ok(result);
    }

    [HttpGet("relations/{mbid}")]
    public async Task<IActionResult> GetRelations(string mbid)
    {
        await Task.Delay(1100); //to avoid 503 as musicbrainz only accepts 1 api-call pr sec

        var result = await _musicBrainzService.GetArtistRelationsAsync(mbid);

        return Ok(result);
    }

    [HttpGet("release-relations/{mbid}")]
    public async Task<IActionResult> GetReleaseRelations(string mbid)
    {
        var result = await _musicBrainzService.GetReleaseRelationsAsync(mbid);

        return Ok(result);
    }

}