'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';

interface Track {
  artist?: string;
  title?: string;
  genre?: string;
}

interface Suggestion {
  artist: string;
  title: string;
  year: string;
  obscurity: string;
  weirdness: string;
  rationale: string;
}

export default function SongSuggester() {
  const [csvData, setCsvData] = useState<string[] | null>(null);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [persona, setPersona] = useState('');
  const [decade, setDecade] = useState('any');
  const [obscurity, setObscurity] = useState(5);
  const [craziness, setCraziness] = useState(5);
  const [region, setRegion] = useState('western');
  const [songCount, setSongCount] = useState(5);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [userPersonality, setUserPersonality] = useState('');
  const [logicApproach, setLogicApproach] = useState('');
  const [futureAdaptation, setFutureAdaptation] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // For collapsible commentary, we'll track an array of booleans
  const [expandedIndices, setExpandedIndices] = useState<boolean[]>([]);

  const regionOptions = [
    { value: 'western', label: 'Western (US, UK, Canada, Australia, Europe)' },
    { value: 'international', label: 'International Mix' },
    { value: 'latin', label: 'Latin America' },
    { value: 'japan', label: 'Japan' },
    { value: 'korea', label: 'Korea' },
    { value: 'france', label: 'France' },
    { value: 'germany', label: 'Germany' },
    { value: 'africa', label: 'Africa' },
    { value: 'india', label: 'India' },
    { value: 'middle_east', label: 'Middle East' },
    { value: 'global', label: 'Global Mix' },
  ];

  const personaOptions = [
    { value: '', label: 'Default AI' },
    { value: 'dj', label: 'Club DJ' },
    { value: 'record store owner', label: 'Record Store Owner' },
    { value: 'lame parents', label: 'Music Parent' },
    { value: 'avant-garde composer', label: 'Avant-Garde Composer' },
    { value: 'pop culture archaeologist', label: 'Pop Culture Archaeologist' },
    { value: 'psychedelic crate digger', label: 'Psychedelic Crate Digger' },
  ];

  const decadeOptions = [
    { value: 'any', label: 'Any Era' },
    { value: '2020s', label: '2020s' },
    { value: '2010s', label: '2010s' },
    { value: '2000s', label: '2000s' },
    { value: '1990s', label: '1990s' },
    { value: '1980s', label: '1980s' },
    { value: '1970s', label: '1970s' },
    { value: '1960s', label: '1960s' },
    { value: 'pre-1960', label: 'Pre-1960s' },
  ];

  // Handle local CSV upload
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const rows = results.data as string[][];
          // You can store them as raw arrays or parse each row differently
          const formattedData = rows
            .filter((row) => row.length > 0 && row[0])
            .map((row) => row.join(' - '));
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
    setSuggestions([]);
    setUserPersonality('');
    setLogicApproach('');
    setFutureAdaptation('');
    setExpandedIndices([]);

    // We'll gather all tracks from either CSV or Spotify
    let finalTracks: Track[] = [];

    // If user provided a Spotify URL, call /api/playlist to fetch track data
    if (spotifyUrl) {
      try {
        const response = await fetch(`/api/playlist?url=${encodeURIComponent(spotifyUrl)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch playlist');
        finalTracks = data.tracks || [];
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError(err instanceof Error ? err.message : 'An error occurred fetching the playlist');
        setIsLoading(false);
        return;
      }
    }

    // If we have CSV data, parse them into track objects
    if (csvData) {
      const csvTracks = csvData.map((line) => {
        // This example assumes "Artist - Title" for each line
        const [artist, title] = line.split(' - ');
        return { artist, title };
      });
      // Combine them. If user gave both CSV and Spotify, unify all tracks
      finalTracks = finalTracks.concat(csvTracks);
    }

    try {
      // Now we call /api/suggestions
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracks: finalTracks,
          spotifyUrl,
          csvData,
          keywords,
          persona,
          decade,
          songCount,
          obscurity,
          craziness,
          region,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get suggestions');

      if (!data.suggestions || !Array.isArray(data.suggestions)) {
        throw new Error('Invalid suggestions format received');
      }

      setSuggestions(data.suggestions);
      setUserPersonality(data.userPersonality || '');
      setLogicApproach(data.logicApproach || '');
      setFutureAdaptation(data.futureAdaptation || '');

      // Initialize collapsed states
      setExpandedIndices(Array(data.suggestions.length).fill(false));
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // For convenience, let user copy suggestions to clipboard
  const handleCopy = () => {
    if (!suggestions || suggestions.length === 0) return;
    const formattedSuggestions = suggestions
      .map((song) => `${song.artist} - ${song.title} (${song.year}) [Obs:${song.obscurity}, Weird:${song.weirdness}]`)
      .join('\n');
    navigator.clipboard.writeText(formattedSuggestions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  return (
    <div>
      <h1>Song Suggester</h1>

      <div className="input-group">
        <label>CSV Upload:</label>
        <input type="file" accept=".csv" onChange={handleCsvUpload} />
      </div>

      <div className="input-group">
        <label>Spotify Playlist URL:</label>
        <input
          type="text"
          placeholder="Spotify playlist URL..."
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Keywords (optional):</label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g., energetic, melancholic, summer vibes"
        />
      </div>

      <div className="input-group">
        <label>AI Persona:</label>
        <select value={persona} onChange={(e) => setPersona(e.target.value)}>
          {personaOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>Music Region:</label>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          {regionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>Era:</label>
        <select value={decade} onChange={(e) => setDecade(e.target.value)}>
          {decadeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>Obscurity Level: {obscurity}/10</label>
        <input
          type="range"
          min="1"
          max="10"
          value={obscurity}
          onChange={(e) => setObscurity(parseInt(e.target.value))}
        />
      </div>

      <div className="input-group">
        <label>Weirdness Level: {craziness}/10</label>
        <input
          type="range"
          min="1"
          max="10"
          value={craziness}
          onChange={(e) => setCraziness(parseInt(e.target.value))}
        />
      </div>

      <div className="input-group">
        <label>Number of Songs: {songCount}</label>
        <input
          type="range"
          min="1"
          max="10"
          value={songCount}
          onChange={(e) => setSongCount(parseInt(e.target.value))}
        />
      </div>

      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Get Suggestions'}
      </button>

      {error && <div className="error">{error}</div>}

      {/* Display persona and logic approach at the top if they exist */}
      {(userPersonality || logicApproach) && (
        <div className="persona-logic-box">
          {userPersonality && (
            <div className="persona-box">
              <h2>Your Persona</h2>
              <p>{userPersonality}</p>
            </div>
          )}
          {logicApproach && (
            <div className="logic-box">
              <h2>Logic Approach</h2>
              <p>{logicApproach}</p>
            </div>
          )}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="suggestions-list">
          <h2>Recommended Songs</h2>
          {suggestions.map((item, index) => (
            <div key={index} className="suggestion-item" style={{ border: '1px solid #ccc', margin: '1rem 0', padding: '1rem' }}>
              <div>
                <strong>{item.artist}</strong> — {item.title} ({item.year})
              </div>
              <div>Obscurity: {item.obscurity}/10 | Weirdness: {item.weirdness}/10</div>
              <button onClick={() => toggleExpand(index)}>
                {expandedIndices[index] ? 'Hide Details' : 'Show Details'}
              </button>
              {expandedIndices[index] && (
                <div style={{ marginTop: '0.5rem' }}>
                  {item.rationale}
                </div>
              )}
            </div>
          ))}

          {/* Future adaptation section */}
          {futureAdaptation && (
            <div className="future-adaptation" style={{ marginTop: '2rem' }}>
              <h3>Future Adaptation</h3>
              <p>{futureAdaptation}</p>
            </div>
          )}

          {/* Copy button */}
          <button onClick={handleCopy} style={{ marginTop: '1rem' }}>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      )}
    </div>
  );
}
