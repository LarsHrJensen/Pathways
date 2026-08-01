import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import Graph from 'graphology';
import Sigma from 'sigma';

@Component({
  selector: 'app-graph',
  imports: [],
  templateUrl: './graph.html',
  styleUrl: './graph.css',
})
export class GraphComponent implements AfterViewInit {

  @ViewChild('container')
  container!: ElementRef;

  ngAfterViewInit(): void {

    const graph = new Graph();

    graph.addNode('A', {
      label: 'Track A',
      x: 0,
      y: 0,
      size: 10
    
  });

  graph.addNode('B', {
      label: 'Track B',
      x: 1,
      y: 1,
      size: 10
    });

    graph.addEdge('A', 'B');

    const sigma = new Sigma(graph, this.container.nativeElement);
  }

}
