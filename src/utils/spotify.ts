export async function getSpotifyApiToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
    if (!clientId || !clientSecret) {
      throw new Error('Missing Spotify credentials');
    }
  
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials'
        }).toString(),
      });
  
      if (!response.ok) {
        const error = await response.text();
        console.error('Token fetch error:', error);
        throw new Error('Failed to fetch token');
      }
  
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Token fetch error:', error);
      throw error;
    }
  }