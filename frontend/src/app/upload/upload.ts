import { Component } from '@angular/core';
import { UploadService } from '../shared/services/upload.service';
import { PlaylistService } from '../shared/services/playlist.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.html',
  styleUrl: './upload.css',
})

export class Upload {

  constructor(private uploadService: UploadService, 
              private playlistService: PlaylistService
          ) {}

  async onFileSelected(event: Event): Promise<void> {

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }
    
    const file = input.files[0];

    const tracks = await this.uploadService.upload(file);

    this.playlistService.setTracks(tracks);

  }
}
