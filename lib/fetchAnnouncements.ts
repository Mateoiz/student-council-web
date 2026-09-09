import type { FBPost } from "../components/AnnouncementsSection";

const PAGE_ID = process.env.FB_PAGE_ID!;
const TOKEN   = process.env.FB_PAGE_ACCESS_TOKEN!;

const FIELDS = [
  "id",
  "message",
  "story",
  "created_time",
  "full_picture",
  "permalink_url",
].join(",");

export async function fetchAnnouncements(limit = 5): Promise<FBPost[]> {
  const url = new URL(`https://graph.facebook.com/v26.0/${PAGE_ID}/posts`);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", TOKEN);

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error("[FB Graph] fetch failed:", await res.text());
    return [];
  }

  const json = await res.json();
  return (json.data ?? []) as FBPost[];
}