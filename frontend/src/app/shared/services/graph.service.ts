import { Injectable } from '@angular/core';
import Graph from 'graphology';
import Sigma from 'sigma';

@Injectable({
  providedIn: 'root',
})
export class GraphService {

    createGraph(): Graph {

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

        return graph;
    }
}