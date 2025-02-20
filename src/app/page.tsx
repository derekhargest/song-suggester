import SongSuggester from '@/components/SongSuggester';

export default function Home() {
  return (
    <main className="container">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Music Suggester</h1>
      <p className="text-center mb-8 text-gray-600">
        Get personalized music suggestions based on your preferences and existing playlists
      </p>
      <SongSuggester />
    </main>
  );
}