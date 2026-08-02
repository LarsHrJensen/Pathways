import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import Sigma from 'sigma';
import { GraphService } from '../shared/services/graph.service';
import { PlaylistService } from '../shared/services/playlist.service';

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

  constructor(private graphService: GraphService,
              private playlistService: PlaylistService
  ) {}

  ngAfterViewInit(): void {
    this.playlistService.tracks$.subscribe(tracks => {
      if (tracks.length === 0) {
        return;
      }

      this.sigma?.kill();

      const graph = this.graphService.createGraph(tracks);

      this.sigma = new Sigma(graph, this.container.nativeElement);
    });
  }

}
