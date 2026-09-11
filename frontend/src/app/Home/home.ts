import { Component } from '@angular/core';
import { Upload } from '../upload/upload';
import { RouterLink } from '@angular/router';
import { GraphComponent } from '../graph/graph';
import { Search } from "../search/search";
import { SearchResult } from '../shared/models/search';

@Component({
  selector: 'app-home',
  imports: [Upload, RouterLink, GraphComponent, Search],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  selectedResult: SearchResult | null = null;

  onResultSelected(result: SearchResult): void {
  this.selectedResult = result;
  }

}
