import { NextResponse } from 'next/server';

const analyzePlaylist = (tracks: any[]) => {
  const artistCount: Record<string, number> = {};
  const genreCount: Record<string, number> = {};
  const decadeCount: Record<string, number> = {};
  
  tracks.forEach((track) => {
    const artist = track.artist?.trim();
    const genre = track.genre?.trim();
    const year = track.year || (track.title?.match(/\((\d{4})\)/) || [])[1];
    
    if (artist) artistCount[artist] = (artistCount[artist] || 0) + 1;
    if (genre) genreCount[genre] = (genreCount[genre] || 0) + 1;
    if (year) {
      const decade = Math.floor(parseInt(year) / 10) * 10;
      decadeCount[decade] = (decadeCount[decade] || 0) + 1;
    }
  });

  const topDecade = Object.entries(decadeCount)
    .sort(([, a], [, b]) => b - a)
    .shift();

  return { artistCount, genreCount, decadeCount, topDecade };
};

const getPersonaPrompt = (persona: string): string => {
  switch (persona) {
    case 'dj':
      return 'You are a club DJ with encyclopedic knowledge of electronic, dance, club music, and underground scenes.';
    case 'record store owner':
      return 'You are a veteran record store owner with 30 years of experience and deep knowledge of rare, influential, and underground music.';
    case 'lame parents':
      return 'You are a music-obsessed parent who grew up collecting vinyl and experiencing multiple musical eras firsthand.';
    case 'avant-garde composer':
      return 'You are an avant-garde composer who merges experimental music theory with global sounds.';
    case 'pop culture archaeologist':
      return 'You are a pop culture archaeologist, excavating forgotten hits and fascinating obscurities from every era.';
    case 'psychedelic crate digger':
      return 'You are a psychedelic crate digger, unearthing mind-bending tracks from 60s psych rock to cosmic beat tapes.';
    default:
      return 'You are a music historian and curator with a wide lens across cultures and decades.';
  }
};

const generatePlaylistName = () => {
  const funnyNames = [
    "Lemon Fresh", "Irreverent Gusts of Wind", "Earl", "First Break Up",
    "Sonic Daydreams", "Melancholic Sunshine", "Dancing Shadows",
    "Yesterday's Tomorrow", "Midnight Snack", "Cosmic Debris",
    "Pocket Full of Stars", "The Last Bus Home", "Rainy Day Emergency",
    "Secret Menu Items", "Lost and Found Dreams"
  ];
  
  return funnyNames[Math.floor(Math.random() * funnyNames.length)];
};

const parseSuggestion = (line: string) => {
  try {
    const match = line.match(/SONG:\s*(.+?)\s*-\s*(.+?)\s*\((\d{4})\)\s*\[Obscurity:\s*(\d+)\/10,\s*Weirdness:\s*(\d+)\/10\]\s*\((.*?)\)/);
    
    if (match) {
      const [_, artist, title, year, obscurity, weirdness, rationale] = match;
      return {
        artist: artist.trim(),
        title: title.trim(),
        year,
        obscurity: Number(obscurity),
        weirdness: Number(weirdness),
        rationale: rationale.trim()
      };
    }
  } catch (error) {
    console.error('Error parsing suggestion:', line);
  }
  return null;
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  try {
    const { craziness, obscurity, decade, keywords, persona, region, tracks, songCount = 8 } = await request.json();
    
    // Simplify tracks to just artist and title
    const simplifiedTracks = (tracks || []).map(track => ({
      artist: track.artist?.trim(),
      title: track.title?.trim()
    }));

    // Analyze simplified tracks
    const artistCounts = {};
    simplifiedTracks.forEach(track => {
      if (track.artist) {
        const artists = track.artist.split(';').map(a => a.trim());
        artists.forEach(artist => {
          if (artist) {
            artistCounts[artist] = (artistCounts[artist] || 0) + 1;
          }
        });
      }
    });

    const topArtistsList = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([artist]) => artist)
      .join(', ');

    const prompt = `As a Western music curator, you have a deep understanding of song popularity and experimental nature.

WEIRDNESS SCALE (${craziness}/10 requested):
1-3: Conventional pop/rock structure, familiar sounds
4-6: Slight experimentation, unusual elements
7-8: Clearly experimental, unconventional structure
9-10: Avant-garde, highly experimental

OBSCURITY SCALE (${obscurity}/10 requested):
1-3: Major hits, everyone knows these
4-6: Minor hits, music enthusiasts know these
7-8: Deep cuts, dedicated fans know these
9-10: True hidden gems, very few people know these

User's Current Playlist:
${simplifiedTracks.map(t => `- ${t.artist} - ${t.title}`).join('\n')}

Top Artists: ${topArtistsList}

Additional Preferences:
- Era preference: ${decade}
- Keywords/mood: ${keywords}

IMPORTANT: All song suggestions MUST match the requested weirdness (${craziness}/10) and obscurity (${obscurity}/10) levels. 
Stay within +/- 1 point of these targets.

Provide:
1. PERSONA: Create a music personality profile
2. LOGIC: Explain your recommendation strategy
3. ${songCount} SONGS: Artist - Title (Year) [Obscurity: ${obscurity}/10, Weirdness: ${craziness}/10] (Why)
4. FUTURE: Adaptation strategy

Use exact format:
PERSONA: <text>
LOGIC: <text>
SONG: Artist - Title (Year) [Obscurity: X/10, Weirdness: Y/10] (Rationale)
FUTURE: <text>`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    const lines = rawContent.split('\n');
    
    const suggestions = lines
      .filter(line => line.startsWith('SONG'))
      .map(line => parseSuggestion(line))
      .filter(Boolean)
      .slice(0, songCount);

    const userPersonality = lines.find(line => line.startsWith('PERSONA:'))?.replace('PERSONA:', '').trim() || '';
    const logicApproach = lines.find(line => line.startsWith('LOGIC:'))?.replace('LOGIC:', '').trim() || '';
    const futureAdaptation = lines.find(line => line.startsWith('FUTURE:'))?.replace('FUTURE:', '').trim() || '';

    return NextResponse.json({
      playlistName: generatePlaylistName(),
      userAnalysis: `Based on ${simplifiedTracks.length} tracks, frequently listening to ${topArtistsList}`,
      userPersonality,
      logicApproach,
      futureAdaptation,
      suggestions
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
