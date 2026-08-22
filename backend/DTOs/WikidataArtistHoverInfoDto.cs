namespace backend.DTOs;

public class WikidataArtistHoverInfoDto
{
    public string LifeSpan { get; set; } = "";
    public List<string> Occupations { get; set; } = new();
}