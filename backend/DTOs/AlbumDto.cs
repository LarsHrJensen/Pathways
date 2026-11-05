namespace backend.DTOs;
public class AlbumDto
{
    public Guid AlbumId { get; set; }
    public string AlbumName { get; set; } = string.Empty;
    public int? ReleaseYear { get; set; }
}