import { Injectable } from '@angular/core';
import { Track } from '../models/track';
import Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

    constructor() { }

    async upload(file: File): Promise<Track[]> {

        const csv = await file.text();

        const parsedResult = Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
        });

    const tracks: Track[] = parsedResult.data.map((row: any) => ({
        uri: row["Track URI"],
        name: row["Track Name"],
        album: row["Album Name"],
        artists: row["Artist Name(s)"],
        genres: row["Genres"].split(','),
        danceability: Number(row["Danceability"]),
        energy: Number(row["Energy"]),
        valence: Number(row["Valence"]),
        tempo: Number(row["Tempo"]),
        year: Number(row['Release Date']?.slice(0, 4)),
    }));

      console.log(tracks);

      return tracks;
    }
}