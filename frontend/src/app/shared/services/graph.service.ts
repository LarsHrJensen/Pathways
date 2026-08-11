import { Injectable } from '@angular/core';
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
        color: color
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
    total: number
  ): void {

    if (graph.hasNode(artistId)) {
      return;
    }

    const sourceAttributes = graph.getNodeAttributes(sourceNodeId);

    const radius = 0.02
    const angle = (2* Math.PI * index) / total;

    graph.addNode(artistId, {
      label: artistName,
      x: sourceAttributes['x'] + Math.cos(angle) * radius,
      y: sourceAttributes['y'] + Math.sin(angle) * radius,
      size: 4
    });
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