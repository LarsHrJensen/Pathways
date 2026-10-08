import { Attribute, Injectable } from '@angular/core';
import Graph from 'graphology';
import { Track } from '../models/track';
import { ArtistRelation } from '../models/artist-relation';

@Injectable({
  providedIn: 'root',
})
export class GraphService {

  createEmptyGraph(): Graph {
    return new Graph();
  }

  // Creates a graph using valence and energy as node coordinates
  createGraph(tracks: Track[]): Graph {
    const graph = this.createEmptyGraph();

    this.addTracksToGraph(graph, tracks);

    return graph;
  }

  //When adding tracks from imported playlists
  addTracksToGraph(graph : Graph, tracks: Track []): void {
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
        nodeType: 'track',
        expanded: false,
        relationLoaded: false
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
  }

  addArtistNode(
    graph: Graph,
    sourceNodeId: string,
    artistId: string,
    artistName: string,
    artistType: string,
    index: number,
    total: number,
    directionAngle?: number
  ): void {

    if (graph.hasNode(artistId)) {
      graph.setNodeAttribute(artistId, 'hidden', false);
      return;
    }

    const sourceAttributes = graph.getNodeAttributes(sourceNodeId);

    const angle = this.calculateAngle(
      index,
      total,
      directionAngle
    );

    // Increase radius towards the outer edges of the fan
    const baseRadius = 0.02;
    const angleDifference = Math.abs(angle - (directionAngle ?? 0));
    const radiusMultiplier = 1 + 0.3 * Math.sin(angleDifference);

    let radius = baseRadius * radiusMultiplier;

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
      artistType: artistType,
      parentNodeId: sourceNodeId,
      expanded: false,
      relationLoaded: false,
      forceLabel: true
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

    // 2 nodes: spread 60°
    if (total === 2) {
      const spread = Math.PI / 3;
      const startAngle = baseDirection - spread / 2;
      const angleStep = spread / (total - 1);

      return startAngle + angleStep * index;
    }

    // First expansion: distribute nodes around 360°
    if (directionAngle === undefined) {
      return (2 * Math.PI * index) / total;
    }

    // Following expansions: spread 140° forward
    const spread = (140 * Math.PI) / 180;
    const startAngle = baseDirection - spread / 2;
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

  addCategoryNode(
    graph: Graph,
    sourceNodeId: string,
    category: string,
    relations: ArtistRelation[],
    index: number,
    total: number
  ): void {

    const categoryNodeId =
      `${sourceNodeId}-${category.toLowerCase()}`;

    if (graph.hasNode(categoryNodeId)) {
      return;
    }

    const sourceAttributes =
      graph.getNodeAttributes(sourceNodeId);

    const radius = 0.02;

    const angle = this.calculateAngle(
      index,
      total
    );

    let x =
      sourceAttributes['x'] + Math.cos(angle) * radius;

    let y =
      sourceAttributes['y'] + Math.sin(angle) * radius;

    if (this.isPositionOccupied(graph, x, y, 0.01)) {
      const angleOffset = 0.15;
      const alternativeAngle = angle + angleOffset;

      x =
        sourceAttributes['x'] +
        Math.cos(alternativeAngle) * radius;

      y =
        sourceAttributes['y'] +
        Math.sin(alternativeAngle) * radius;
    }

    graph.addNode(categoryNodeId, {
      label: category,
      x: x,
      y: y,
      size: 5,
      nodeType: 'category',
      parentNodeId: sourceNodeId,
      relations: relations
    });

    graph.mergeEdge(sourceNodeId, categoryNodeId);
  }

  addArtistEdge(
    graph: Graph,
    sourceNodeId: string,
    artistId: string
  ): void {
    graph.mergeEdge(sourceNodeId, artistId);
  }

}