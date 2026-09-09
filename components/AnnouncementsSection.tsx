"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, Megaphone } from "lucide-react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────────────────────────
   Type — matches the shape returned by the Facebook Graph API
   GET /{page-id}/posts?fields=id,message,story,created_time,full_picture,permalink_url
────────────────────────────────────────────────────────────────────────────── */
export interface FBPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;       // ISO 8601
  full_picture?: string;      // og-image sized cover photo from the post
  permalink_url: string;
}

/* ─── Stub data — replace with real ISR fetch from Graph API ─────────────── */
const STUB_POSTS: FBPost[] = [
  {
    id: "1",
    message:
      "📢 OPENING OF SY 2026–2027 | Here are the official arrangements for September 1–2 examinations for continuing students. Please read the full memo below and coordinate with your professors.",
    created_time: "2026-08-27T08:00:00+0800",
    full_picture: "/announcements/memo-sy2627.jpg",
    permalink_url: "#",
  },
  {
    id: "2",
    message:
      "🗳️ RESOLUTION NO. 2026-001 | The University Student Council formally endorses the academic calendar adjustment for SY 2026–2027 and calls on all colleges to cascade to their respective constituents.",
    created_time: "2026-08-20T14:00:00+0800",
    full_picture: "/announcements/resolution-001.jpg",
    permalink_url: "#",
  },
  {
    id: "3",
    message:
      "📅 LOCKER BOOKING IS NOW OPEN | Reserve your locker for SY 2026–2027 through the USC portal. Slots are limited — first come, first served.",
    created_time: "2026-08-18T10:30:00+0800",
    full_picture: "/announcements/lockers.jpg",
    permalink_url: "#",
  },
  {
    id: "4",
    message:
      "🎉 LASALLIAN KICKOFF — September 1 | Join us for a mini welcoming activity to kick off the new academic year. See you on campus!",
    created_time: "2026-08-15T09:00:00+0800",
    full_picture: "/announcements/kickoff.jpg",
    permalink_url: "#",
  },
  {
    id: "5",
    message:
      "📋 GENERAL ASSEMBLY SCHEDULE | All colleges are required to hold their respective General Assemblies within the first three weeks of SY 2026–2027. Heads of CSCs, please coordinate with your faculty advisers.",
    created_time: "2026-08-10T16:00:00+0800",
    full_picture: "/announcements/assembly.jpg",
    permalink_url: "#",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(str: string, max: number) {
  return str.length <= max ? str : str.slice(0, max).trimEnd() + "…";
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface AnnouncementsSectionProps {
  /** Pass server-fetched FB posts here. Falls back to stubs when undefined. */
  posts?: FBPost[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════════════════════════ */
export default function AnnouncementsSection({
  posts = STUB_POSTS,
}: AnnouncementsSectionProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

  /* Featured = first post; strip = the rest (up to 4) */
  const [featured, ...strip] = posts;

  return (
    <section
      id="announcements"
      className="border-t border-zinc-200 bg-white"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6 py-16 sm:py-24">

        {/* ── Section header ── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 sm:mb-12 flex items-end justify-between pb-4 border-b-2 border-zinc-900"
        >
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.38em] text-green-600 uppercase font-semibold">
              Announcements
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-none">
              Latest from the USC
            </h2>
          </div>
          <a
            href="https://www.facebook.com/USC_DLSAU" /* ← swap for real page URL */
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-4 py-2 text-xs font-bold tracking-wide text-zinc-700 transition-all hover:border-green-600 hover:text-green-700"
          >
            View all on Facebook
            <ArrowUpRight size={14} />
          </a>
        </motion.div>

        {/* ── Layout: featured left + strip right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-5">

          {/* Featured card */}
          {featured && (
            <FeaturedCard post={featured} index={0} />
          )}

          {/* Strip — 4 compact cards stacked */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {strip.slice(0, 4).map((post, i) => (
              <StripCard key={post.id} post={post} index={i + 1} />
            ))}
          </div>
        </div>

        {/* Mobile "view all" CTA */}
        <div className="mt-8 flex sm:hidden justify-center">
          <a
            href="https://www.facebook.com/USC_DLSAU"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-5 py-2.5 text-sm font-bold text-zinc-700"
          >
            View all on Facebook
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Featured card (large, with cover image) ────────────────────────────── */
function FeaturedCard({ post, index }: { post: FBPost; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.a
      ref={ref}
      href={post.permalink_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:border-green-300 hover:shadow-xl hover:shadow-green-500/10 no-underline"
    >
      {/* Cover image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100">
        {post.full_picture ? (
          <Image
            src={post.full_picture}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          /* Fallback when no image */
          <div className="absolute inset-0 flex items-center justify-center bg-green-50">
            <Megaphone size={48} strokeWidth={1} className="text-green-300" />
          </div>
        )}
        {/* Date pill over image */}
        <span className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 font-mono text-[10px] tracking-widest uppercase text-zinc-600 font-semibold shadow-sm">
          {formatDate(post.created_time)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <p className="flex-1 text-sm sm:text-base text-zinc-700 leading-relaxed">
          {truncate(post.message ?? post.story ?? "", 220)}
        </p>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-700">
          Read on Facebook
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.a>
  );
}

/* ─── Strip card (compact horizontal) ───────────────────────────────────── */
function StripCard({ post, index }: { post: FBPost; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.a
      ref={ref}
      href={post.permalink_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: 20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
      className="group flex items-start gap-3 sm:gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 transition-all duration-300 hover:border-green-300 hover:shadow-lg hover:shadow-green-500/10 no-underline"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
        {post.full_picture ? (
          <Image
            src={post.full_picture}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-green-50">
            <Megaphone size={20} strokeWidth={1} className="text-green-300" />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-1 min-w-0 flex-col gap-1.5">
        <span className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-zinc-400 font-semibold">
          {formatDate(post.created_time)}
        </span>
        <p className="text-xs sm:text-sm text-zinc-700 leading-snug line-clamp-3">
          {post.message ?? post.story ?? ""}
        </p>
      </div>

      {/* Arrow */}
      <ArrowUpRight
        size={15}
        className="mt-0.5 shrink-0 text-green-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
    </motion.a>
  );
}