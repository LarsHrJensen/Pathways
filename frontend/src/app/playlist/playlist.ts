import { Component } from '@angular/core';
import { Track } from '../shared/models/track';

@Component({
  selector: 'app-playlist',
  imports: [],
  templateUrl: './playlist.html',
  styleUrl: './playlist.css',
})
export class Playlist {

  tracks: Track[] = [
    {
      name: "Everything in Its Right Place",
      artist: "Radiohead",
      album: "Kid A",
      year: 2000
    },

    {
      name: "Teardrop",
      artist: "Massive Attack",
      album: "Mezzanine",
      year: 1998
    }
  ];
  
}
