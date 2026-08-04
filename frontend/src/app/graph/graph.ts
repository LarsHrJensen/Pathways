import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import Sigma from 'sigma';
import { GraphService } from '../shared/services/graph.service';
import { PlaylistService } from '../shared/services/playlist.service';
import { Track } from '../shared/models/track';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-graph',
  imports: [],
  templateUrl: './graph.html',
  styleUrl: './graph.css',
})
export class GraphComponent implements AfterViewInit {

  @ViewChild('container')
  container!: ElementRef;

  private sigma?: Sigma;
  selectedTrack?: Track;

  constructor(private graphService: GraphService,
              private playlistService: PlaylistService,
              private cdr: ChangeDetectorRef
  ) {}

    ngAfterViewInit(): void {
      this.playlistService.tracks$.subscribe(tracks => {
          if (tracks.length === 0) {
              return;
          }

          this.sigma?.kill();

          const graph = this.graphService.createGraph(tracks);

          console.log(
    'Container width:',
    this.container.nativeElement.offsetWidth
);

          this.sigma = new Sigma(
              graph,
              this.container.nativeElement
          );

          const camera = this.sigma.getCamera();

          camera.on('updated', cameraState => {
              graph.forEachNode((node, attributes) => {
                const track = tracks.find(track => track.uri === node);

                if (!track) {
                    return;
                }

                let label = track.artists;

                if (cameraState.ratio < 0.2) {
                label = `${track.artists} - ${track.name}`;
                }

                if (cameraState.ratio < 0.05) {
                label = `${track.artists} - ${track.name} - ${track.album}`;
                }

                graph.setNodeAttribute(node, 'label', label);

              });

              this.sigma!.scheduleRefresh();
          });

          this.sigma.on('clickNode', ({ node }) => {
              const selectedTrack = tracks.find(
                  track => track.uri === node
              );

              console.log(selectedTrack?.genres);
              
              
                this.selectedTrack = selectedTrack;
                this.cdr.detectChanges();
              
          });
      });
  }
}
