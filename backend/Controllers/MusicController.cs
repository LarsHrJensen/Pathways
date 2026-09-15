using Microsoft.AspNetCore.Mvc;
using backend.Services;


namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MusicController : ControllerBase
{
    private readonly MusicBrainzService _musicBrainzService;
    private readonly WikidataService _wikidataService;

    public MusicController(MusicBrainzService musicBrainzService, WikidataService wikidataService)
    {
        _musicBrainzService = musicBrainzService;
        _wikidataService = wikidataService;
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

    [HttpGet("recoding-relations/{mbid}")]
    public async Task<IActionResult> GetRecordingRelations(string mbid)
    {
        await _musicBrainzService.GetArtistRecordingRelationsAsync(mbid);

        return Ok();
    }

    [HttpGet("work-relations/{mbid}")]
    public async Task<IActionResult> GetWorkRelations(string mbid)
    {
        await _musicBrainzService.GetArtistWorkRelationsAsync(mbid);

        return Ok();
    }

    [HttpGet("artist-release-relations/{mbid}")]
    public async Task<IActionResult> GetArtistReleaseRelations(string mbid)
    {
        await _musicBrainzService.GetArtistReleaseRelationsAsync(mbid);

        return Ok();
    }

 [HttpGet("test-releases/{mbid}")]
public async Task<IActionResult> TestReleases(string mbid)
{
    await _musicBrainzService.GetReleaseGroupReleasesAsync(mbid);

    return Ok();
}

    [HttpGet("projects/{mbid}")]
    public async Task<IActionResult> GetProjects(string mbid)
    {
        var result =
            await _musicBrainzService.GetArtistProjectRelationsAsync(mbid);

        return Ok(result);
    }

    [HttpGet("albums/{mbid}")]
    public async Task<IActionResult> GetAlbums(string mbid)
    {
        var result = await _musicBrainzService.GetArtistAlbumsAsync(mbid);

        return Ok(result);
    }

    [HttpGet("release-relations/{mbid}")]
    public async Task<IActionResult> GetReleaseRelations(string mbid)
    {
        var result = await _musicBrainzService.GetReleaseRelationsAsync(mbid);

        return Ok(result);
    }

    [HttpGet("wikidata/{wikidataId}")]
    public async Task<IActionResult> GetWikidataArtist(string wikidataId)
    {
        var result =
            await _wikidataService.GetWikidataArtistHoverInfoAsync(wikidataId);

        return Ok(result);
    }

    [HttpGet("hover/{mbid}")]
    public async Task<IActionResult> GetWikidataIdFromMbId(string mbid)
    {
        var wikidataId = await _musicBrainzService.GetWikidataIdAsync(mbid);

        Console.WriteLine($"MBID: {mbid}, Wikidata ID: {wikidataId ?? "none"}");

        if (wikidataId is null)
        {
            return NotFound();
        }    

        var result =
            await _wikidataService.GetWikidataArtistHoverInfoAsync(wikidataId);

        return Ok(result);
    }

    [HttpGet("grouphover/{mbid}")]
    public async Task<IActionResult> GetWikidataGroupHoverFromMbid(string mbid)
    {
        var wikidataId = await _musicBrainzService.GetWikidataIdAsync(mbid);

        if (wikidataId is null)
        {
            return NotFound();
        }

        var result =
            await _wikidataService.GetWikidataGroupHoverInfoAsync(wikidataId);

        return Ok(result);
    }

    [HttpGet("search/{query}")]
    public async Task<IActionResult> GetSearchResult(string query)
    {
        try
        {
            var result = await _musicBrainzService.GetSearchResultAsync(query);
            return Ok(result);
        }
        catch (HttpRequestException)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                "Music search is temporarily unavailable."
            );
        }
    }

}