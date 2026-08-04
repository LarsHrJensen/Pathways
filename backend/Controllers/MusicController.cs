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
}