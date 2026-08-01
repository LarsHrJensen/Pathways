import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import Sigma from 'sigma';
import { GraphService } from '../shared/services/graph.service';

@Component({
  selector: 'app-graph',
  imports: [],
  templateUrl: './graph.html',
  styleUrl: './graph.css',
})
export class GraphComponent implements AfterViewInit {

  @ViewChild('container')
  container!: ElementRef;

  constructor(private graphService: GraphService) {}

  ngAfterViewInit(): void {

    const graph = this.graphService.createGraph();

    new Sigma(graph, this.container.nativeElement);
  }

}
