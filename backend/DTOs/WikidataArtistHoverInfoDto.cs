namespace backend.DTOs;

public class WikidataArtistHoverInfoDto
{
    public string LifeSpan { get; set; } = "";
    public List<string> Occupations { get; set; } = new();
    public List<string> Genres { get; set; } = new();
    public List<string> Bands { get; set; } = new ();
    public string Origin { get; set;} = "";
}