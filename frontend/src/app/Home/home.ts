import { Component } from '@angular/core';
import { Upload } from '../upload/upload';
import { RouterLink } from '@angular/router';
import { GraphComponent } from '../graph/graph';
import { Search } from "../search/search";

@Component({
  selector: 'app-home',
  imports: [Upload, RouterLink, GraphComponent, Search],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
