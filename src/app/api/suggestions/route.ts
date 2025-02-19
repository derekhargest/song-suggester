import { NextResponse } from 'next/server';
import axios from 'axios';

const MOCK_MODE = true; // Toggle this to switch between mock and real API

const mockResponses = [
  {
    suggestions: [
      {
        title: "Radiohead - Weird Fishes/Arpeggi",
        year: "2007",
        obscurity: "4"
      },
      {
        title: "Boards of Canada - Roygbiv",
        year: "1998",
        obscurity: "7"
      },
      {
        title: "Four Tet - Angel Echoes",
        year: "2010",
        obscurity: "6"
      },
      {
        title: "Aphex Twin - Xtal",
        year: "1992",
        obscurity: "5"
      },
      {
        title: "Jon Hopkins - Open Eye Signal",
        year: "2013",
        obscurity: "6"
      }
    ]
  },
  {
    suggestions: [
      {
        title: "Beach House - Space Song",
        year: "2015",
        obscurity: "3"
      },
      {
        title: "Tame Impala - Let It Happen",
        year: "2015",
        obscurity: "2"
      },
      {
        title: "MGMT - Little Dark Age",
        year: "2018",
        obscurity: "3"
      },
      {
        title: "Unknown Mortal Orchestra - Multi-Love",
        year: "2015",
        obscurity: "5"
      },
      {
        title: "King Gizzard & The Lizard Wizard - Work This Time",
        year: "2014",
        obscurity: "6"
      }
    ]
  }
];

export async function POST(request: Request) {
  if (MOCK_MODE) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Randomly select one of the mock responses
    const mockResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    return NextResponse.json(mockResponse);
  }

  try {
    const body = await request.json();
    const { csvData, spotifyUrl, keywords, persona, decade, songCount, obscurity } = body;

    let prompt = `Generate song suggestions based on this user's musical tastes.

You are taking on the following persona when making suggestions:
${persona}

OBSCURITY LEVEL GUIDELINES (Current Level: ${obscurity}/10):
0-2: Exclusively mainstream hits and widely recognized artists
3-4: Mostly popular artists but including some of their lesser-known tracks
5-6: Mix of mainstream and underground, focusing on respected artists who aren't household names
7-8: Primarily underground/indie artists with devoted followings but limited mainstream exposure
9-10: Extremely obscure artists, rare tracks, and experimental music

Please suggest exactly ${songCount} songs.
Format each suggestion EXACTLY like this: Artist - Song Title (YEAR) [Obscurity: X/10]`;

    if (decade !== 'any') {
      prompt += `\n\nOnly suggest songs from the ${decade}.`;
    }

    if (csvData) {
      prompt += `\n\nUser's Current Playlist:\n${csvData.join('\n')}`;
    }

    if (keywords) {
      prompt += `\n\nKeywords/Mood to consider: ${keywords}`;
    }

    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const suggestions = openaiResponse.data.choices[0].message.content
      .split('\n')
      .filter((line: string) => line.trim() !== '')
      .map((line: string) => {
        const match = line.match(/^(.*?)\s*\((\d{4})\)\s*\[Obscurity:\s*(\d+)\/10\]$/);
        if (match) {
          return {
            title: match[1].trim(),
            year: match[2],
            obscurity: match[3]
          };
        }
        return {
          title: line.trim(),
          year: 'N/A',
          obscurity: obscurity.toString()
        };
      });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}