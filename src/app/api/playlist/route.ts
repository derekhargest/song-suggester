import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const spotifyUrl = searchParams.get('url');

    if (!spotifyUrl) {
      return NextResponse.json(
        { error: 'No Spotify URL provided.' },
        { status: 400 }
      );
    }

    // EXAMPLE parsing
    let playlistId = '';
    const match = spotifyUrl.match(/playlist\/([^?]+)/);
    if (match) {
      playlistId = match[1];
    } else {
      return NextResponse.json(
        { error: 'Invalid Spotify URL format.' },
        { status: 400 }
      );
    }

    // If you do not have real credentials, you can stub this out:
    // return NextResponse.json({ tracks: [] });

    // Otherwise, fetch a token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64'),
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      return NextResponse.json({ error: 'Spotify auth failed: ' + text }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Now fetch the actual playlist tracks
    const playlistRes = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!playlistRes.ok) {
      const text = await playlistRes.text();
      return NextResponse.json({ error: 'Failed to fetch playlist: ' + text }, { status: 500 });
    }

    const playlistData = await playlistRes.json();

    // We'll parse out track info
    const tracks = (playlistData.items || []).map((item: any) => {
      const track = item.track;
      return {
        artist: track?.artists?.[0]?.name || 'Unknown Artist',
        title: track?.name || 'Unknown Title',
        genre: '', // optional
      };
    });

    return NextResponse.json({ tracks });
  } catch (error: any) {
    console.error('Error in /api/playlist route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
