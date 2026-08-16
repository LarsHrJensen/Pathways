import { Attribute, Injectable } from '@angular/core';
import Graph from 'graphology';
import { Track } from '../models/track';

@Injectable({
  providedIn: 'root',
})
export class GraphService {

  // Creates a graph using valence and energy as node coordinates
  createGraph(tracks: Track[]): Graph {

    const graph = new Graph();

    tracks.forEach((track) => {

      const red = Math.round(track.valence * 255);
      const blue = Math.round((1 - track.valence) * 255);

      // Adjust brightness based on energy
      const brightness = 0.7 + track.energy * 0.3;

      const color = `rgb(${Math.round(red * brightness)}, 0, ${Math.round(blue * brightness)})`;

      graph.addNode(track.uri, {
        label: `${track.name}`,
        x: track.valence,
        y: track.energy,
        size: 5,
        color: color,
        nodeType: 'track'
      });
    });

    tracks.forEach((track) => {

      const closestTrack = this.findClosestTrackByEnergyAndValence(
        track,
        tracks
      );

      if (closestTrack) {
        graph.mergeEdge(
          track.uri,
          closestTrack.track.uri
        );
      }
    });

    return graph;
  }

  addArtistNode(
    graph: Graph,
    sourceNodeId: string,
    artistId: string,
    artistName: string,
    index: number,
    total: number,
    directionAngle?: number
  ): void {

    if (graph.hasNode(artistId)) {
      graph.setNodeAttribute(artistId, 'hidden', false);
      return;
    }

    const sourceAttributes = graph.getNodeAttributes(sourceNodeId);

    let radius = 0.02

   const angle = this.calculateAngle(
    index,
    total,
    directionAngle
   );

    let x = sourceAttributes['x'] + Math.cos(angle) * radius;
    let y = sourceAttributes['y'] + Math.sin(angle) * radius;

    if (this.isPositionOccupied(graph, x, y, 0.01)) {

    const angleOffset = 0.15;
    const alternativeAngle = angle + angleOffset;

    x = sourceAttributes['x'] + Math.cos(alternativeAngle) * radius;
    y = sourceAttributes['y'] + Math.sin(alternativeAngle) * radius;
  }

    graph.addNode(artistId, {
      label: artistName,
      x: x,
      y: y,
      size: 4,
      nodeType: 'artist',
      parentNodeId: sourceNodeId,
      expanded: false,
      relationLoaded: false
    });
  }

  private isPositionOccupied(
    graph: Graph,
    x: number,
    y: number,
    minimumDistance: number
  ): boolean{

    let occupied = false;

    graph.forEachNode((node, attributes) => {
      const nodeX = attributes['x'];
      const nodeY = attributes['y'];

      const xDifference = x - nodeX;
      const yDifference = y- nodeY;

      const distance = Math.sqrt(
        xDifference * xDifference +
        yDifference * yDifference
      );

      if (distance < minimumDistance) {
        occupied = true
      }
    });

    return occupied;
  }

  private calculateAngle(
    index: number,
    total: number,
    directionAngle?: number
  ): number {

    const baseDirection = directionAngle ?? 0;

    // 1 node: straight ahead
    if (total === 1) {
      return baseDirection;
    }

    // 2 nodes: 60° spread around the direction
    if (total === 2) {
      const spread = Math.PI / 3;
      const startAngle = baseDirection - spread / 2;
      const angleStep = spread / (total - 1);

      return startAngle + angleStep * index;
    }

    // First click with 3+ nodes: spread 360°
    if (directionAngle === undefined) {
      return (2 * Math.PI * index) / total;
    }

    // Following clicks with 3+ nodes: spread 180° away from parent
    const spread = Math.PI;
    const startAngle = directionAngle - spread / 2;
    const angleStep = spread / (total - 1);

    return startAngle + angleStep * index;
  }
  

  // Finds the closest track using Euclidean distance in valence/energy space
  private findClosestTrackByEnergyAndValence(
    currentTrack: Track,
    tracks: Track[]
  ): { track: Track; difference: number } | undefined {

    let closestTrack: Track | undefined;
    let smallestDifference = Infinity;

    tracks.forEach((track) => {

      if (track.uri === currentTrack.uri) {
        return;
      }

      const valenceDifference =
        currentTrack.valence - track.valence;

      const energyDifference =
        currentTrack.energy - track.energy;

      const difference = Math.sqrt(
        valenceDifference * valenceDifference +
        energyDifference * energyDifference
      );

      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestTrack = track;
      }
    });

    if (closestTrack) {
      return {
        track: closestTrack,
        difference: smallestDifference,
      };
    }

    return undefined;
  }

  addArtistEdge(
    graph: Graph,
    sourceNodeId: string,
    artistId: string
  ): void {
    graph.mergeEdge(sourceNodeId, artistId);
  }

}