import { Injectable } from '@angular/core';
import Graph from 'graphology';
import { Track } from '../models/track';

@Injectable({
  providedIn: 'root',
})
export class GraphService {

    createGraph(tracks: Track[]): Graph {

        const graph = new Graph();

        
        tracks.forEach((track) => {
            graph.addNode(track.uri, {
                label: `${track.name} - ${track.artists} (${track.valence.toFixed(2)})`,
                x: track.valence,
                y: track.energy,
                size: 5,
            });
        });
        
        tracks.forEach(track => {
            const closestTrack = this.findClosestTrackByValence(
                track,
                tracks
            );

            if (closestTrack) {
                graph.mergeEdge(
                    track.uri, 
                    closestTrack.track.uri);
            }
        });

        return graph;
    }

        private findClosestTrackByValence(
            currentTrack: Track,
            tracks: Track[]
        ): { track: Track; difference: number } | undefined {

        let closestTrack: Track | undefined;
        let smallestDifference = Infinity;

        tracks.forEach(track => {
            if (track.uri === currentTrack.uri) {
                return;
            }

            const difference = Math.abs(
                currentTrack.valence - track.valence
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
}