'use client';

import { useState } from 'react';
import Papa from 'papaparse';

interface Suggestion {
  title: string;
  year: string;
  obscurity: string;
}

export default function SongSuggester() {
  const [csvData, setCsvData] = useState<string[] | null>(null);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [persona, setPersona] = useState('');
  const [decade, setDecade] = useState('any');
  const [songCount, setSongCount] = useState(10);
  const [obscurity, setObscurity] = useState(5);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const formattedData = results.data
            .filter((row: any) => row.length > 0 && row[0])
            .map((row: any) => row.join(' - '));
          setCsvData(formattedData);
        },
        error: (error) => {
          setError('Error parsing CSV file: ' + error.message);
        }
      });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          spotifyUrl,
          keywords,
          persona,
          decade,
          songCount,
          obscurity,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="input-group">
        <label>Upload Playlist (CSV)</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
        />
      </div>

      <div className="input-group">
        <label>Spotify Playlist URL</label>
        <input
          type="text"
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          placeholder="https://open.spotify.com/playlist/..."
        />
      </div>

      <div className="input-group">
        <label>Keywords or Mood</label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g., energetic, summer vibes, melancholic"
        />
      </div>

      <div className="input-group">
        <label>Curator Persona</label>
        <textarea
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="Describe your curator persona..."
        />
      </div>

      <div className="input-group">
        <label>Decade</label>
        <select value={decade} onChange={(e) => setDecade(e.target.value)}>
          <option value="any">Any Decade</option>
          <option value="2020s">2020s</option>
          <option value="2010s">2010s</option>
          <option value="2000s">2000s</option>
          <option value="1990s">1990s</option>
          <option value="1980s">1980s</option>
          <option value="1970s">1970s</option>
          <option value="1960s">1960s</option>
        </select>
      </div>

      <div className="input-group">
        <label>Number of Songs: {songCount}</label>
        <input
          type="range"
          min="1"
          max="20"
          value={songCount}
          onChange={(e) => setSongCount(Number(e.target.value))}
          className="range-slider"
        />
      </div>

      <div className="input-group">
        <label>Obscurity Level: {obscurity}/10</label>
        <input
          type="range"
          min="0"
          max="10"
          value={obscurity}
          onChange={(e) => setObscurity(Number(e.target.value))}
          className="range-slider"
        />
      </div>

      <button
        className="button"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate Suggestions'}
      </button>

      {error && (
        <div className="error">{error}</div>
      )}

      {suggestions.length > 0 && (
        <div className="suggestions-list">
          <h2>Suggestions</h2>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              <div>{suggestion.title}</div>
              <div>Year: {suggestion.year} | Obscurity: {suggestion.obscurity}/10</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}