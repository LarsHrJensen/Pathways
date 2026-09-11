import { 
    Component, 
    AfterViewInit, 
    ViewChild, 
    ElementRef,
    Input,
    SimpleChanges
} from '@angular/core';
import Sigma from 'sigma';
import { MouseCoords, NodeDisplayData, PartialButFor } from 'sigma/types';
import { Settings } from 'sigma/settings';
import { GraphService } from '../shared/services/graph.service';
import { PlaylistService } from '../shared/services/playlist.service';
import { Track } from '../shared/models/track';
import { ChangeDetectorRef } from '@angular/core';
import Graph from 'graphology';
import { Attributes } from 'graphology-types';
import { MusicBrainzApiService } from '../shared/services/musicbrainz-api.service';
import { ArtistRelation } from '../shared/models/artist-relation';
import { WikidataArtistHoverInfo } from '../shared/models/wikidata-artist-hover-info';
import { WikidataGroupHoverInfo } from '../shared/models/wikidata-group-hover-info';
import { SearchResult } from '../shared/models/search';

@Component({
  selector: 'app-graph',
  imports: [],
  templateUrl: './graph.html',
  styleUrl: './graph.css',
})
export class GraphComponent implements AfterViewInit {

  @Input() selectedResult: SearchResult | null = null;

  @ViewChild('container')
  container!: ElementRef;

  private hoverTimeout?: ReturnType<typeof setTimeout>;
  private sigma?: Sigma;
  private graph?: Graph;
  private activePathNodeIds = new Set<string>();
  activePathLabels: string[] = [];
  hoveredArtistInfo?: WikidataArtistHoverInfo;
  hoveredArtistName?: string;
  hoveredGroupInfo?: WikidataGroupHoverInfo;

  hoverX = 0;
  hoverY = 0;

  selectedTrack?: Track;

  constructor(private graphService: GraphService,
              private playlistService: PlaylistService,
              private musicbrainzApiService: MusicBrainzApiService,
              private cdr: ChangeDetectorRef //Angular service used to recognize changes in components state and the update html
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
            this.container.nativeElement, {
                    defaultDrawNodeLabel: (context, data, settings) => {
                        this.drawNodeLabel(context, data, settings);
                    }
                }
            );

            this.setupZoomLabels(this.graph, tracks);
            this.setupNodeClick(tracks);

            this.sigma.on('enterNode', ({ node, event }) => {
                this.handleEnterNodeHover(node, event);
            });

            this.sigma.on('leaveNode', () => {
                this.handleLeaveNodeHover();
            });
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedResult'] && this.selectedResult) {
            this.addSearchResultToGraph(this.selectedResult);
        }
    }

    // Places label up center for tracks from playlist and up right for relation nodes
    private drawNodeLabel(
        context: CanvasRenderingContext2D,
        data: PartialButFor<NodeDisplayData, "label" | "color" | "size" | "x" | "y">,
        settings: Settings<Attributes, Attributes, Attributes>
    ): void{
        const nodeType = this.graph!.getNodeAttribute(data['key'], 'nodeType');

                    if (!data.label) {
                        return;
                    }

                    context.font =
                    `${settings.labelWeight} ${settings.labelSize}px ${settings.labelFont}`;

                    if (nodeType === 'track'){
                        context.textAlign = 'center';
                        context.fillText(
                        data.label,
                        data.x,
                        data.y - 15);
                    }else {
                        context.textAlign = 'left';
                        context.fillText(
                            data.label,
                            data.x + 17,
                            data.y + 3
                        );
                    }
    }

    private handleEnterNodeHover(node: string, event: MouseCoords): void{
        const nodeType = this.graph!.getNodeAttribute(
            node,
            'nodeType'
        );

          if (nodeType !== 'artist'){
            return;
          }
        
          const artistType = this.graph!.getNodeAttribute(
            node,
            'artistType'
          );

          if (artistType === 'Person'){
            this.hoverTimeout = setTimeout(() => {
                this.loadArtistHoverInfo(node);
            }, 300);

          } else if (artistType === 'Group'){
            this.hoverTimeout = setTimeout(() => {
                this.loadGroupHoverInfo(node);
            }, 300);
          
          }

            this.hoverX = event.x;
            this.hoverY = event.y;

            this.hoveredArtistName =
                this.graph!.getNodeAttribute(node, 'label');
            
            
    }

    private handleLeaveNodeHover(): void{
        if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
                this.hoverTimeout = undefined;
            }

            this.hoveredArtistInfo = undefined;
            this.hoveredArtistName = undefined;

            this.cdr.detectChanges();
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

    //Handles 1st click on track from uploaded playlist
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
                relation.artistType,
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
                relation.artistType,
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

    private addSearchResultToGraph(result: SearchResult): void {
        console.log('Will add node: ', result.id, result.name, result.type);
    }

    private loadArtistRelations(
        selectedTrack: 
        Track,sourceNode: string
    ): void {
        this.musicbrainzApiService
            .getArtist(selectedTrack.artists)
            .subscribe(artist => {               

                this.musicbrainzApiService
                    .getArtistRelations(artist.id)
                    .subscribe(relations => {                       

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
                
                this.addRelationsToBandMember(
                    relations, 
                    artistId, 
                    parentNodeId);
            });
    }

    private loadArtistHoverInfo(
        wikidataId: string //Actually recieves an MBID, but backend resolves it to a wikiDataId
    ): void {
        this.musicbrainzApiService
            .getWikidataArtistHoverInfo(wikidataId)
            .subscribe(info => {
                console.log('Hover info:', info);

                this.hoveredArtistInfo = info;
                this.cdr.detectChanges();
            });
    }

    private loadGroupHoverInfo(
        wikidataId: string
    ): void {
        this.musicbrainzApiService
            .getWikidataGroupHoverInfo(wikidataId)
            .subscribe(info => {
                console.log('Group hover info: ', info)

                this.hoveredGroupInfo = info;
                this.cdr.detectChanges();
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
        
        const expanded =
            this.graph!.getNodeAttribute(nodeId, 'expanded');

        const relationLoaded =
        this.graph!.getNodeAttribute(nodeId, 'relationLoaded');

        if (expanded) {
            this.collapseNode(nodeId)
        } else if (relationLoaded) {
            this.expandNode(nodeId);          
        } else {
            this.loadArtistRelations(selectedTrack, nodeId);
            this.graph!.setNodeAttribute(nodeId, 'relationLoaded', true);
        }

        this.graph!.setNodeAttribute(nodeId, 'expanded', !expanded);

    }

    private handleArtistClick(nodeId: string): void {
        const expanded =
            this.graph!.getNodeAttribute(nodeId, 'expanded');

        const relationLoaded =
        this.graph!.getNodeAttribute(nodeId, 'relationLoaded');

        if (expanded) {
            this.collapseNode(nodeId);
            this.graph!.setNodeAttribute(nodeId, 'color', 'grey');
        } else if (relationLoaded) {
            this.expandNode(nodeId);
            this.graph!.setNodeAttribute(nodeId, 'color', 'green');
        } else {
            this.loadRelationByArtistId(nodeId);
            this.graph!.setNodeAttribute(nodeId, 'relationLoaded', true);
            this.graph!.setNodeAttribute(nodeId, 'color', 'green');
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
