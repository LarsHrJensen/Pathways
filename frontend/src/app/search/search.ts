import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms" 

@Component({
    selector: 'app-search',
    imports: [FormsModule],
    templateUrl: './search.html',
    styleUrl: './search.css'
})
export class Search{
    artists = [
    { id: 1, name: 'Brian Eno', type: 'Person' },
    { id: 2, name: 'David Bowie', type: 'Person' },
    { id: 3, name: 'Roxy Music', type: 'Band' },
    { id: 4, name: 'Nirvana', type: 'Band' },
    { id: 5, name: 'Steve Albini', type: 'Person' }
  ];

  searchTerm: string = '';
}