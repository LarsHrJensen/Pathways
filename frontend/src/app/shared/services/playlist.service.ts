import { Injectable } from '@angular/core';
import { Track } from '../models/track';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  private trackSubject = new BehaviorSubject<Track[]>([]);
  
  tracks$ = this.trackSubject.asObservable();

  setTracks(tracks: Track[]): void {
    this.trackSubject.next(tracks);
  }

  getTracks(): Track[] {
    return this.trackSubject.value;
  }
}