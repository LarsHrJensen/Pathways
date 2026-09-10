import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms" 
import { SearchResult } from "../shared/models/search";
import { MusicBrainzApiService } from "../shared/services/musicbrainz-api.service";
import { ChangeDetectorRef } from "@angular/core";

@Component({
    selector: 'app-search',
    imports: [FormsModule],
    templateUrl: './search.html',
    styleUrl: './search.css'
})
export class Search{
    
  constructor(
    private musicbrainzApiService: MusicBrainzApiService,
    private cdr: ChangeDetectorRef
  ) {}

  searchTerm: string = '';
  searchResults: SearchResult[] = [];

  search(query: string): void{
     query = query.trim();

    if (!query) {
      this.searchResults = [];
      return
    }

    this.musicbrainzApiService
    .getSearchResult(this.searchTerm)
    .subscribe(results => {

      if (this.searchTerm.trim() === query) {
        this.searchResults = results;
        this.cdr.detectChanges(); //TODO: Temporary workaround. Why doesn't httpclient response trigger change detection automatically
      }
      
    });

  }
}