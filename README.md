# Pathways – Discover Music as a Journey

Pathways is a music exploration platform that visualizes connections between artists, albums, genres and musical scenes.

Unlike traditional recommendation systems that primarily predict what users will like next, Pathways focuses on exploration: helping users discover new musical directions through an interactive map of connections.

For a detailed description of the vision and concept, see:

[Pathways Project Description](docs/project-description.pdf)

For short video of the main idea, see:

[Short video of main functions](https://drive.google.com/file/d/1xEh15RIIVmn6cAGk7--vd4ALoWsBNSm9/view?usp=drive_link)

## Current Features

- Import playlist data from CSV
- Visualize playlist tracks as an interactive graph
- Position tracks using audio features such as valence and energy
- Display track metadata
- Connect the Angular frontend to the ASP.NET Core backend
- Integrate MusicBrainz artist search
- Retrieve artist-to-artist relationships from MusicBrainz
- Expand playlist nodes with related artists
- Continue exploration by clicking newly discovered artist nodes
- Prevent duplicate artist nodes

## Roadmap

Pathways is currently evolving from a playlist visualization into a broader
music exploration tool. The goal is to let users start somewhere familiar,
follow musical connections, and discover unexpected paths through artists,
bands, collaborations, labels, genres, and tracks.

Development is currently focused on:

- **Graph exploration** – expand and collapse nodes, control graph growth, and make multi-step exploration easier to navigate.
- **Path tracking** – keep track of the route through artists and relationships as the user explores the graph.
- **Richer graph semantics** – distinguish between tracks, people, bands, labels, and genres, and make relationship types visible.
- **Entity information** – provide richer information about artists and bands, including collaborations, associated projects, genres, and other relevant context.
- **Multiple starting points** – allow exploration to begin from an artist, band, label, or genre in addition to an imported playlist.
- **Discovery filters** – filter exploration by relationship type, time period, genre, distance, and other criteria.
- **Saving discoveries** – select interesting discoveries, export them to CSV, save exploration paths, and potentially create playlists through Spotify.
- **Playlist exploration and analysis** – combine and compare multiple playlists and explore patterns within a user's own music collection.

A more detailed development plan is available in [the roadmap](docs/ROADMAP.md).

## Technology Stack

### Frontend
- Angular
- TypeScript
- Sigma.js
- Graphology
- Papa Parse

### Backend
- ASP.NET Core Web API
- C#
- MusicBrainz API

### Planned
- PostgreSQL
- Additional music data sources
