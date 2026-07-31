import { Injectable } from '@angular/core';
import { Track } from '../models/track';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  private tracks: Track[] = [];

  setTracks(tracks: Track[]): void {
    this.tracks = tracks;
  }

  getTracks(): Track[] {
    return this.tracks;
  }
}