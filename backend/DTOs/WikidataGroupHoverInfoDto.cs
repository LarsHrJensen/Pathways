namespace backend.DTOs;

public class WikidataGroupHoverInfoDto
{
    public string? ActiveYears { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<string> Members { get; set;} = new();
    public List<string> FormerMembers { get; set; } = new();
    public string? Origin { get; set; }
}