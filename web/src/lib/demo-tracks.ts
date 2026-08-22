export const DEMO_TRACKS = [
  {
    id: "demo-1",
    name: "Blinding Lights",
    artist: "The Weeknd",
    preview_url: "https://p.scdn.co/mp3-preview/4c8pK6NYrJQ59y3V72yEYnLrQp5vGg8Y0",
    cover: "https://i.scdn.co/image/ab67616d0000b273c63e4c8c8c8c8c8c8c8c8c8c",
  },
  {
    id: "demo-2",
    name: "Levitating",
    artist: "Dua Lipa",
    preview_url: "https://p.scdn.co/mp3-preview/5b7y7Y5y5y5y5y5y5y5y5y5y5y5y5y5y",
    cover: "https://i.scdn.co/image/ab67616d0000b273d7e8d7e8d7e8d7e8d7e8d7e8",
  },
  {
    id: "demo-3",
    name: "As It Was",
    artist: "Harry Styles",
    preview_url: "https://p.scdn.co/mp3-preview/6c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
    cover: "https://i.scdn.co/image/ab67616d0000b273e8f9e0d1c2b3a4f5e6d7c8b9",
  },
  {
    id: "demo-4",
    name: "Bad Habits",
    artist: "Ed Sheeran",
    preview_url: "https://p.scdn.co/mp3-preview/7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
    cover: "https://i.scdn.co/image/ab67616d0000b273f0e1d2c3b4a5f6e7d8c9b0a1",
  },
  {
    id: "demo-5",
    name: "Stay",
    artist: "The Kid LAROI, Justin Bieber",
    preview_url: "https://p.scdn.co/mp3-preview/8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    cover: "https://i.scdn.co/image/ab67616d0000b273a1b2c3d4e5f6a7b8c9d0e1f2",
  },
  {
    id: "demo-6",
    name: "Heat Waves",
    artist: "Glass Animals",
    preview_url: "https://p.scdn.co/mp3-preview/9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    cover: "https://i.scdn.co/image/ab67616d0000b273b2c3d4e5f6a7b8c9d0e1f2a3",
  },
  {
    id: "demo-7",
    name: "Industry Baby",
    artist: "Lil Nas X, Jack Harlow",
    preview_url: "https://p.scdn.co/mp3-preview/0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
    cover: "https://i.scdn.co/image/ab67616d0000b273c3d4e5f6a7b8c9d0e1f2a3b4",
  },
  {
    id: "demo-8",
    name: "Shivers",
    artist: "Ed Sheeran",
    preview_url: "https://p.scdn.co/mp3-preview/1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
    cover: "https://i.scdn.co/image/ab67616d0000b273d4e5f6a7b8c9d0e1f2a3b4c5",
  },
  {
    id: "demo-9",
    name: "Cold Heart",
    artist: "Elton John, Dua Lipa",
    preview_url: "https://p.scdn.co/mp3-preview/2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f",
    cover: "https://i.scdn.co/image/ab67616d0000b273e5f6a7b8c9d0e1f2a3b4c5d6",
  },
  {
    id: "demo-10",
    name: "Enemy",
    artist: "Imagine Dragons, JID",
    preview_url: "https://p.scdn.co/mp3-preview/3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
    cover: "https://i.scdn.co/image/ab67616d0000b273f6a7b8c9d0e1f2a3b4c5d6e7",
  },
];

export function getDemoTracks(query: string, limit = 8) {
  const q = query.toLowerCase();
  return DEMO_TRACKS
    .filter(t => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
    .slice(0, limit);
}
