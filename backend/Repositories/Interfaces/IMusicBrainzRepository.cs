using backend.DTOs;

namespace repositories.interfaces;
public interface IMusicBrainzRepository
{
    Task<List<AlbumDto>> GetAlbumsAsync(Guid artistId);

    Task<List<ProducerDto>> GetAlbumProducersAsync(Guid albumMbid);
}