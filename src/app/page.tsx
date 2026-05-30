"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Hash, MessageSquare, Users, Layers,
  Search, TrendingUp, Sparkles, Clock, ChevronRight,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tags: string[];
  updated_at: string;
  thread_count: number;
  member_count: number;
}

interface Discussion {
  id: string;
  title: string;
  body: string;
  created_at: string;
  reply_count: number;
  author: { username: string } | null;
  room: { name: string; slug: string } | null;
}

interface Stats {
  users: number;
  rooms: number;
  threads: number;
  messages: number;
}

const PLACEHOLDERS = [
  "I'm learning French and want to practice…",
  "Thinking about moving to Canada…",
  "Struggling to find a frontend job…",
  "Just became a new mom and feeling overwhelmed…",
  "How do I deal with burnout?",
  "Planning to move to Toronto…",
  "Looking for startup co-founders…",
];

export default function HomePage() {
  const router = useRouter();
  const [thought, setThought] = useState("");
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState("");
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotating placeholder
  useEffect(() => {
    let i = 0;
    intervalRef.current = setInterval(() => {
      i = (i + 1) % PLACEHOLDERS.length;
      setPlaceholder(PLACEHOLDERS[i]);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Fetch all data in parallel
  useEffect(() => {
    Promise.all([
      fetch("/api/rooms").then((r) => r.json()),
      fetch("/api/discussions").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ]).then(([roomsData, discussionsData, statsData]) => {
      if (Array.isArray(roomsData)) setRooms(roomsData);
      if (Array.isArray(discussionsData)) setDiscussions(discussionsData);
      if (statsData && typeof statsData.rooms === "number") setStats(statsData);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: thought }),
      });
      const data = await res.json();
      if (data.room) router.push(`/room/${data.room.slug}`);
    } catch {
      setLoading(false);
    }
  };

  // Client-side filter (name, description, tags)
  const filteredRooms = filter.trim()
    ? rooms.filter((r) => {
        const q = filter.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
    : rooms;

  return (
    <div className="min-h-[calc(100vh-56px)]">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6 border"
          style={{ background: "rgba(124,111,239,0.1)", borderColor: "rgba(124,111,239,0.3)", color: "#a89cf8" }}>
          <Sparkles className="w-3 h-3" /> AI-powered room matching
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
          What&apos;s on <span className="gradient-text">your mind?</span>
        </h1>
        <p className="text-base max-w-md mx-auto mb-8" style={{ color: "var(--text-secondary)" }}>
          Type anything — a thought, question, or feeling. Our AI finds the right room instantly.
        </p>

        {/* Search */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <div className="relative rounded-2xl overflow-hidden border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder={placeholder}
              rows={3}
              className="w-full bg-transparent px-6 pt-5 pb-16 text-base resize-none outline-none"
              style={{ color: "var(--text-primary)" }}
            />
            <div className="absolute bottom-4 right-4">
              <button type="submit" disabled={loading || !thought.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Matching…
                  </span>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Find My Room <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      {stats && (
        <div className="max-w-3xl mx-auto px-4 mb-12">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users, label: "Members", value: stats.users },
              { icon: Layers, label: "Rooms", value: stats.rooms },
              { icon: MessageSquare, label: "Discussions", value: stats.threads },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border p-4 text-center"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: "#7c6fef" }} />
                <p className="text-xl font-bold">{value.toLocaleString()}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ALL ROOMS ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mb-14">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: "#7c6fef" }} />
            <h2 className="font-bold text-xl">All Rooms</h2>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(124,111,239,0.15)", color: "#a89cf8" }}>
              {rooms.length}
            </span>
          </div>
          {/* Filter input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-secondary)" }} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter rooms…"
              className="pl-8 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-purple-500"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                width: "200px",
              }}
            />
          </div>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="rounded-xl border p-10 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No rooms match &ldquo;{filter}&rdquo; —{" "}
              <button onClick={() => { setThought(filter); setFilter(""); }}
                className="underline hover:text-purple-400 transition-colors">
                use AI to find or create one
              </button>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredRooms.map((room) => (
              <a key={room.id} href={`/room/${room.slug}`}
                className="card-glow rounded-xl p-4 border flex flex-col gap-2 transition-all hover:border-purple-500/50 cursor-pointer"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                    {room.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-sm leading-tight line-clamp-2">{room.name}</span>
                </div>
                {room.description && (
                  <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {room.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mt-auto">
                  {room.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: "rgba(124,111,239,0.15)", color: "#a89cf8" }}>
                      <Hash className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs pt-1 border-t"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />{room.thread_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />{room.member_count ?? 0}
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />{timeAgo(room.updated_at)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ── POPULAR DISCUSSIONS ───────────────────────────────── */}
      {discussions.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5" style={{ color: "#4facde" }} />
            <h2 className="font-bold text-xl">Popular Discussions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {discussions.map((d) => (
              <a key={d.id}
                href={d.room ? `/room/${d.room.slug}/thread/${d.id}` : "#"}
                className="card-glow rounded-xl border p-4 flex flex-col gap-2 transition-all hover:border-blue-500/40 cursor-pointer"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                {d.room && (
                  <div className="flex items-center gap-1 text-xs"
                    style={{ color: "#7c6fef" }}>
                    <Hash className="w-3 h-3" />{d.room.name}
                  </div>
                )}
                <p className="text-sm font-medium line-clamp-2 leading-snug">{d.title}</p>
                <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>{d.body}</p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t text-xs"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                  <span>@{d.author?.username ?? "anonymous"}</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{d.reply_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{timeAgo(d.created_at)}
                    </span>
                  </span>
                </div>
              </a>
            ))}
          </div>

          {discussions.length > 0 && (
            <div className="text-center mt-6">
              <a href="/room/mental-health"
                className="inline-flex items-center gap-1.5 text-sm hover:text-purple-400 transition-colors"
                style={{ color: "var(--text-secondary)" }}>
                Browse all discussions <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
