import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Playlist } from './playlist/playlist';

export const routes: Routes = [
    {
        path: '',
        component: Home,
    },
    {
        path: 'playlist',
        component: Playlist,
    }
];
