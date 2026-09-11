import { 
  Component, 
  OnInit, 
  Output, 
  EventEmitter, 
  ChangeDetectorRef 
} from "@angular/core";
import { FormsModule } from "@angular/forms" 
import { SearchResult } from "../shared/models/search";
import { MusicBrainzApiService } from "../shared/services/musicbrainz-api.service";
import { Subject } from "rxjs";
import { debounceTime, switchMap } from "rxjs";

@Component({
    selector: 'app-search',
    imports: [FormsModule],
    templateUrl: './search.html',
    styleUrl: './search.css'
})
export class Search implements OnInit{
  
  @Output() resultSelected = new EventEmitter<SearchResult>();

  constructor(
    private musicbrainzApiService: MusicBrainzApiService,
    private cdr: ChangeDetectorRef
  ) {}

  private searchSubject = new Subject<string>()

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        switchMap(query => 
          this.musicbrainzApiService.getSearchResult(query)
        )
      )

      .subscribe({
        next: results => {
          this.searchResults = results;
          this.cdr.detectChanges();
        },
        error: error => {
          if (error.status === 503) {
            console.log('Search service is temporarily unavailable.');
          } else {
            console.log('Search failed:', error);
          }
        }
      });
  }

  searchTerm: string = '';
  searchResults: SearchResult[] = [];

  search(query: string): void{
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    this.searchSubject.next(trimmedQuery);
  }

  selectResult(result: SearchResult): void {
    this.resultSelected.emit(result);
    console.log('Selected search result: ', result);
    
  }
}