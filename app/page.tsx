import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import NavRailSection from "@/components/NavRailSection";
import AnnouncementsSection from "@/components/AnnouncementsSection";
import FaqSection from "@/components/FaqSection";
import { fetchAnnouncements } from "@/lib/fetchAnnouncements";

export const revalidate = 300;

export default async function Home() {
  const posts = await fetchAnnouncements(5);

  return (
    <main className="min-h-screen overflow-hidden bg-white text-zinc-900">
      <Navbar />
      <HeroSection />
            <AnnouncementsSection posts={posts} />
      <NavRailSection />
      <FaqSection />
    </main>
  );
}