import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MusicBrainzArtist } from '../models/musicbrainz-artist';
import { ArtistRelation } from '../models/artist-relation';
import { WikidataArtistHoverInfo } from '../models/wikidata-artist-hover-info'
import { WikidataGroupHoverInfo } from '../models/wikidata-group-hover-info';

@Injectable({
    providedIn: 'root'
})
export class MusicBrainzApiService {
    private readonly apiUrl = 'http://localhost:5081/api/music';

    constructor(private http: HttpClient) {}

    getArtist(artist: string): Observable<MusicBrainzArtist> {
        return this.http.get<MusicBrainzArtist>(
            `${this.apiUrl}/${encodeURIComponent(artist)}`
        );
    }

    getArtistRelations(mbid: string): Observable<ArtistRelation[]> {
        return this.http.get<ArtistRelation[]>(
            `${this.apiUrl}/relations/${mbid}`
        );
    }

    getWikidataArtistHoverInfo(wikidataId: string){
        return this.http.get<WikidataArtistHoverInfo>(
            `${this.apiUrl}/hover/${wikidataId}`
        );
    }

    getWikidataGroupHoverInfo(wikidataId: string){
        return this.http.get<WikidataGroupHoverInfo>(
            `${this.apiUrl}/grouphover/${wikidataId}`
        );
    }
}