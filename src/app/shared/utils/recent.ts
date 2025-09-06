// src/app/shared/utils/recent.ts
export interface RecentLite {
  id: number;
  title: string;
  imageUrl?: string;
  artistName?: string;
}

export function pushRecent(p: RecentLite) {
  try {
    const raw = localStorage.getItem('recent_products');
    const list: { id: number; title: string; image?: string; artistName?: string }[] = raw
      ? JSON.parse(raw)
      : [];
    const next = [
      { id: p.id, title: p.title, image: p.imageUrl, artistName: p.artistName },
      ...list,
    ]
      .filter((v, i, arr) => arr.findIndex((w) => w.id === v.id) === i) // dédupe par id
      .slice(0, 20); // limite

    localStorage.setItem('recent_products', JSON.stringify(next));
  } catch {
    // pas de throw côté UI
  }
}
