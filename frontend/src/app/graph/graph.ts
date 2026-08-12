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
            const nodeType = this.graph!.getNodeAttribute(node, 'nodeType');
                console.log('Node type:', nodeType);

            const selectedTrack = tracks.find(
            track => track.uri === node
            );

            this.selectedTrack = selectedTrack;

            if (nodeType === 'track' && selectedTrack){
                this.loadArtistRelations(selectedTrack, node);
            }

            if (nodeType === 'artist'){
                this.loadRelationByArtistId(node);
            }

            this.cdr.detectChanges();
        });
    }

    //Handles 1st click on track and gives band members only
    private addMemberRelationsToGraph(
        relations: ArtistRelation[],
        sourceNode: string
    ): void {
        const memberRelations = relations.filter(
            relation => relation.relationType === 'member of band'
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
        sourceNode: string
    ): void{
        relations.forEach((relation, index) => {
            this.graphService.addArtistNode(
                this.graph!,
                sourceNode,
                relation.artistId,
                relation.artistName,
                index,
                relations.length
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
        this.musicbrainzApiService
            .getArtistRelations(artistId)
            .subscribe(relations => {
                console.log('Clicked artist relations:', relations);

                this.addRelationsToBandMember(relations, artistId);
            });
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
}
