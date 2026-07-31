import { Component } from '@angular/core';
import { PlaylistService } from '../shared/services/playlist.service';
import { Track } from '../shared/models/track';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [],
  templateUrl: './playlist.html',
  styleUrl: './playlist.css',
})

export class Playlist {

    tracks: Track[] = [];

    constructor(private playlistService: PlaylistService) {
    this.tracks = this.playlistService.getTracks();
  }
}
