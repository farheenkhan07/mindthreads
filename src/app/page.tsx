"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, TrendingUp, Clock, ArrowRight, Hash } from "lucide-react";
import type { Room } from "@/types";

const PLACEHOLDERS = [
  "French…",
  "Canada PR…",
  "Frontend jobs…",
  "Mom life…",
  "Moving to Toronto…",
  "Anxiety & work…",
  "Learning to cook…",
  "Startup ideas…",
];

export default function HomePage() {
  const router = useRouter();
  const [thought, setThought] = useState("");
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);

  // Rotating placeholder
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % PLACEHOLDERS.length;
      setPlaceholder(PLACEHOLDERS[i]);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Fetch trending rooms
  useEffect(() => {
    fetch("/api/rooms").then((r) => r.json()).then(setRooms).catch(() => {});
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

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full mb-8 border"
          style={{ background: "rgba(124,111,239,0.1)", borderColor: "rgba(124,111,239,0.3)", color: "#a89cf8" }}>
          <Sparkles className="w-3.5 h-3.5" />
          Type a thought. Find your people.
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
          What&apos;s on{" "}
          <span className="gradient-text">your mind?</span>
        </h1>

        <p className="text-lg max-w-md mx-auto mb-12" style={{ color: "var(--text-secondary)" }}>
          Type anything — a topic, a question, a feeling. We&apos;ll find your room instantly.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
          <div className="relative rounded-2xl overflow-hidden border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder={placeholder}
              rows={3}
              className="w-full bg-transparent px-6 pt-5 pb-16 text-lg resize-none outline-none placeholder-opacity-40"
              style={{ color: "var(--text-primary)" }}
            />
            <div className="absolute bottom-4 right-4">
              <button
                type="submit"
                disabled={loading || !thought.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Finding room…
                  </span>
                ) : (
                  <>Find My Room <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {["French", "Canada PR", "Frontend jobs", "Mom life", "Mental health"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setThought(tag)}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:border-purple-500"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                {tag}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* Trending rooms */}
      <section className="max-w-6xl mx-auto w-full px-4 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5" style={{ color: "#7c6fef" }} />
          <h2 className="font-bold text-xl">Trending Rooms</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.slice(0, 8).map((room) => (
            <a key={room.id} href={`/room/${room.slug}`}
              className="card-glow rounded-xl p-4 border transition-all hover:border-purple-500/50 cursor-pointer"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                  {room.name.charAt(0)}
                </div>
                <span className="font-semibold truncate">{room.name}</span>
              </div>
              <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--text-secondary)" }}>
                {room.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {room.tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: "rgba(124,111,239,0.15)", color: "#a89cf8" }}>
                    <Hash className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Recent thoughts */}
      <section className="max-w-6xl mx-auto w-full px-4 pb-20">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5" style={{ color: "#4facde" }} />
          <h2 className="font-bold text-xl">Popular Discussions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { q: "What's the best way to learn French fast?", room: "french" },
            { q: "Express Entry CRS score — what's realistic?", room: "canada-pr" },
            { q: "Is it worth doing side projects for job applications?", room: "frontend-jobs" },
            { q: "How do you balance work and being a new mom?", room: "mom-life" },
            { q: "Best neighbourhoods in Toronto for young professionals?", room: "moving-to-toronto" },
            { q: "How do you deal with burnout?", room: "mental-health" },
          ].map((item) => (
            <a key={item.q} href={`/room/${item.room}`}
              className="card-glow text-sm p-4 rounded-xl border transition-all hover:border-blue-500/40 cursor-pointer"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              <span className="text-blue-400 mr-1.5">&ldquo;</span>
              {item.q}
              <span className="text-blue-400 ml-1.5">&rdquo;</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
