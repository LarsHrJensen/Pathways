import { Component } from '@angular/core';
import { Upload } from '../upload/upload';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [Upload, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
