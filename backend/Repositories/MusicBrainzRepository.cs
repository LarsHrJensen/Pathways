using backend.DTOs;
using Npgsql;
using repositories.interfaces;

namespace repositories;
public class MusicBrainzRepository : IMusicBrainzRepository
{
    private readonly NpgsqlDataSource _dataSource;

    public MusicBrainzRepository(NpgsqlDataSource dataSource)
    {
        _dataSource = dataSource;
    }

    public async Task<List<AlbumDto>> GetAlbumsAsync (Guid artistId)
    {
        var albums = new List<AlbumDto>();

        const string sql = """
            SELECT
                rg.gid AS album_id,
                rg.name AS album_name,
                MIN(rc.date_year) AS release_year
            FROM musicbrainz.release_group rg
            JOIN musicbrainz.artist_credit_name acn
                ON rg.artist_credit = acn.artist_credit
            JOIN musicbrainz.artist a
                ON acn.artist = a.id
            JOIN musicbrainz.release r
                ON r.release_group = rg.id
            JOIN musicbrainz.release_status rs
                ON r.status = rs.id
            LEFT JOIN musicbrainz.release_country rc
                ON rc.release = r.id
            WHERE a.gid = $1
                AND rg.type = 1
                AND rs.name = 'Official'
                AND NOT EXISTS (
                    SELECT 1
                    FROM musicbrainz.release_group_secondary_type_join stj
                    WHERE stj.release_group = rg.id
                )
            GROUP BY rg.gid, rg.name
            ORDER BY release_year NULLS LAST, rg.name;
            """;

        await using var command = _dataSource.CreateCommand(sql);

        command.Parameters.Add(
            new NpgsqlParameter { Value = artistId }
        );

        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            albums.Add(new AlbumDto
            {
                AlbumId = reader.GetGuid(0),
                AlbumName = reader.GetString(1),
                ReleaseYear = reader.IsDBNull(2)
                    ? null
                    : reader.GetInt32(2)
            });
        }

        return albums;
    }
}