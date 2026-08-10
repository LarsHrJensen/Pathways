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

            const brightness = 0.7 + track.energy * 0.3; // Adjust brightness based on energy

            const color = `rgb(${Math.round(red * brightness)}, 0, ${Math.round(blue * brightness)})`;

            graph.addNode(track.uri, {
                label: `${track.name}`,
                x: track.valence,
                y: track.energy,
                size: 5,
                color: color
            });
        });
        
        tracks.forEach(track => {
            const closestTrack = this.findClosestTrackByEnergyAndValence(     //correct this when exploring different methods finding closest track
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

        // Finds the closest track using Euclidean distance in valence/energy space

        private findClosestTrackByEnergyAndValence(
            currentTrack: Track,
            tracks: Track[]
        ): { track: Track; difference: number } | undefined {

            let closestTrack: Track | undefined;
            let smallestDifference = Infinity;

            tracks.forEach(track => {
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
}