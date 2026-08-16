import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import Sigma from 'sigma';
import { GraphService } from '../shared/services/graph.service';
import { PlaylistService } from '../shared/services/playlist.service';
import { Track } from '../shared/models/track';
import { ChangeDetectorRef } from '@angular/core';
import Graph from 'graphology';
import { MusicBrainzApiService } from '../shared/services/musicbrainz-api.service';
import { ArtistRelation } from '../shared/models/artist-relation';

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
  private graph?: Graph;
  private activePathNodeIds = new Set<string>();
  activePathLabels: string[] = [];

  selectedTrack?: Track;

  constructor(private graphService: GraphService,
              private playlistService: PlaylistService,
              private musicbrainzApiService: MusicBrainzApiService,
              private cdr: ChangeDetectorRef
  ) {}

   ngAfterViewInit(): void {
    this.playlistService.tracks$.subscribe(tracks => {
            if (tracks.length === 0) {
            return;
            }

            this.sigma?.kill();

            this.graph = this.graphService.createGraph(tracks);

            this.sigma = new Sigma(
            this.graph,
            this.container.nativeElement
            );

            this.setupZoomLabels(this.graph, tracks);
            this.setupNodeClick(tracks);
        });
    }

    // Sets up zoom labels based on the camera's zoom ratio
    private setupZoomLabels(graph: Graph, tracks: Track[]): void {
    const camera = this.sigma!.getCamera();

    camera.on('updated', cameraState => {
            graph.forEachNode(node => {
            const track = tracks.find(track => track.uri === node);

            if (!track) {
                return;
            }

            const label = this.getTrackLabel(
                track,
                cameraState.ratio
            );

            graph.setNodeAttribute(node, 'label', label);
            });

            this.sigma!.scheduleRefresh();
        });
    }

    private setupNodeClick(tracks: Track[]): void {
        this.sigma!.on('clickNode', ({ node }) => {
            this.updateActivePath(node);

            const nodeType = this.graph!.getNodeAttribute(node, 'nodeType');
                console.log('Node type:', nodeType);

            const selectedTrack = tracks.find(
                track => track.uri === node
            );

            this.selectedTrack = selectedTrack;

            if (nodeType === 'track' && selectedTrack){
                this.handleTrackClick(selectedTrack, node);
            }

            if (nodeType === 'artist'){
               this.handleArtistClick(node);
            }

            this.cdr.detectChanges();
        });

        this.sigma!.on('rightClickNode', ({ node, event }) => {
            event.preventSigmaDefault();

            this.searchNodeOnGoogle(node);
        });
    }

    //Handles 1st click on track and gives band members only
    private addMemberRelationsToGraph(
        relations: ArtistRelation[],
        sourceNode: string
    ): void {
        const memberRelations = relations.filter(
            relation => 
                relation.relationType === 'member of band' ||
                relation.relationType === 'instrumental supporting musician' ||
                relation.relationType === 'conductor' ||
                relation.relationType === 'tribute'
        );

        memberRelations.forEach((relation, index) => {
            this.graphService.addArtistNode(
                this.graph!,
                sourceNode,
                relation.artistId,
                relation.artistName,
                index,
                memberRelations.length
            );

            this.graphService.addArtistEdge(
                this.graph!,
                sourceNode,
                relation.artistId
            );
        });
    }

    //Handles 2nd click on specific band member to show relations to him/her
    private addRelationsToBandMember(
        relations: ArtistRelation[],
        sourceNode: string,
        parentNodeId: string
    ): void{

        const parentAttributes = this.graph!.getNodeAttributes(parentNodeId);
        const sourceAttibutes = this.graph!.getNodeAttributes(sourceNode);

        const directionAngle = Math.atan2(
            sourceAttibutes['y'] - parentAttributes['y'],
            sourceAttibutes['x'] - parentAttributes['x']
        );

        relations.forEach((relation, index) => {
            this.graphService.addArtistNode(
                this.graph!,
                sourceNode,
                relation.artistId,
                relation.artistName,
                index,
                relations.length,
                directionAngle
            );

            this.graphService.addArtistEdge(
                this.graph!,
                sourceNode,
                relation.artistId
            );
        })
    }

    private loadArtistRelations(
        selectedTrack: 
        Track,sourceNode: string
    ): void {
        this.musicbrainzApiService
            .getArtist(selectedTrack.artists)
            .subscribe(artist => {
                console.log('MusicBrainz artist data:', artist);
                console.log('MBID:', artist.id);

                this.musicbrainzApiService
                    .getArtistRelations(artist.id)
                    .subscribe(relations => {
                        console.log('Artist relations:', relations);

                        this.addMemberRelationsToGraph(relations, sourceNode);
                    });
            });
    }


    private loadRelationByArtistId(
        artistId: string
    ): void {

        const parentNodeId = this.graph!.getNodeAttribute(
            artistId,
            'parentNodeId'
        );

        this.musicbrainzApiService
            .getArtistRelations(artistId)
            .subscribe(relations => {
                console.log('Clicked artist relations:', relations);

                this.addRelationsToBandMember(
                    relations, 
                    artistId, 
                    parentNodeId);
            });
    }

    private collapseNode(nodeId: string): void {
        const graph = this.graph!;

        graph.forEachNode((childNodeId, attributes) => {
            if (attributes['parentNodeId'] === nodeId) {
                graph.setNodeAttribute(childNodeId, 'hidden', true);
            }
        });
    }

    private expandNode(nodeId: string): void {
        const graph = this.graph!;

        graph.forEachNode((childNodeId, attributes) => {
            if (attributes['parentNodeId'] === nodeId) {
                graph.setNodeAttribute(childNodeId, 'hidden', false);
            }
        });
    }

    private handleTrackClick(
        selectedTrack: Track,
        nodeId: string
    ): void {
        this.loadArtistRelations(selectedTrack, nodeId);
    }

    private handleArtistClick(nodeId: string): void {
        const expanded =
            this.graph!.getNodeAttribute(nodeId, 'expanded');

        const relationsLoaded =
        this.graph!.getNodeAttribute(nodeId, 'relationsLoaded');

        if (expanded) {
            this.collapseNode(nodeId);
        } else if (relationsLoaded) {
            this.expandNode(nodeId);
        } else {
            this.loadRelationByArtistId(nodeId);
            this.graph!.setNodeAttribute(nodeId, 'relationsLoaded', true);
        }

        this.graph!.setNodeAttribute(nodeId, 'expanded', !expanded);
    }

    private updateActivePath(nodeId: string): void {
        const graph = this.graph!;

        this.activePathNodeIds.clear();
        this.activePathLabels = [];

        let currentNodeId: string | undefined = nodeId;

        while (currentNodeId && graph.hasNode(currentNodeId)) {
            this.activePathNodeIds.add(currentNodeId);

            const label = graph.getNodeAttribute(currentNodeId, 'label');
            this.activePathLabels.unshift(label);

            const parentNodeId: string | undefined = graph.getNodeAttribute(
                currentNodeId,
                'parentNodeId'
            );

            currentNodeId = parentNodeId;
        }

        console.log('Active path:', this.activePathNodeIds);
        console.log('Active path labels:', this.activePathLabels);
    }
   
    // Determines the label of a track based on the zoom ratio
    private getTrackLabel(track: Track, zoomRatio: number): string {
        let label = track.artists;

        if (zoomRatio < 0.2) {
        label = `${track.artists} - ${track.name}`;
        }

        if (zoomRatio < 0.05) {
        label = `${track.artists} - ${track.name} - ${track.album}`;
        }

        return label;
    }

    private searchNodeOnGoogle(nodeId: string): void {
        const label =
            this.graph!.getNodeAttribute(nodeId, 'label');

        const searchUrl = 
            `https://www.google.com/search?q=${encodeURIComponent(label)}`;

        window.open(searchUrl, '_blank');
    }
}
