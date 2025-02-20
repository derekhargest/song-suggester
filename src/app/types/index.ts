export interface Suggestion {
  artist: string;
  title: string;
  year: string;
  obscurity: string;
  weirdness: string;
  rationale: string;
  genreContext?: string;
  historicalContext?: string;
}

export interface Track {
  artist: string;
  title: string;
  genre?: string[];
}

export interface UserTasteProfile {
  topArtists: string[];
  topGenres: string[];
  era: string;
  region: string;
  experimentalTolerance: number;
  obscurityPreference: number;
}
