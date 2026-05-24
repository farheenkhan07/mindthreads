"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThreadCard } from "@/components/ThreadCard";
import { ChatPanel } from "@/components/ChatPanel";
import { CreateThreadModal } from "@/components/CreateThreadModal";
import { Hash, Users, MessageSquare } from "lucide-react";
import type { Room, Thread, Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

interface ThreadWithMeta extends Omit<Thread, 'author'> {
  reply_count: number;
  author: Profile | null;
}

interface Props {
  room: Room;
  initialThreads: ThreadWithMeta[];
  memberCount: number;
  serverUser: User | null;
}

export function RoomClient({ room, initialThreads, memberCount, serverUser }: Props) {
  const supabase = createClient();
  const [threads, setThreads] = useState<ThreadWithMeta[]>(initialThreads);
  const [activeTab, setActiveTab] = useState<"threads" | "chat">("threads");

  const refreshThreads = useCallback(async () => {
    const { data } = await supabase
      .from("threads")
      .select("*, author:profiles(id, username, avatar_url, created_at), reply_count:replies(count)")
      .eq("room_id", room.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) {
      setThreads(data.map((t) => ({
        ...t,
        reply_count: Array.isArray(t.reply_count) ? t.reply_count[0]?.count ?? 0 : (t.reply_count ?? 0),
      })));
    }
  }, [room.id, supabase]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

      {/* LEFT SIDEBAR */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-20 space-y-4">
          <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3"
              style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
              {room.name.charAt(0)}
            </div>
            <h2 className="font-bold text-lg leading-tight mb-1">{room.name}</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>{room.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <Users className="w-4 h-4" />
                <span>{memberCount} members</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <MessageSquare className="w-4 h-4" />
                <span>{threads.length} discussions</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>RELATED TAGS</p>
            <div className="flex flex-wrap gap-2">
              {room.tags?.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(124,111,239,0.15)", color: "#a89cf8" }}>
                  <Hash className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER — threads */}
      <main className="flex-1 min-w-0">
        {/* Mobile room header */}
        <div className="lg:hidden mb-4 rounded-xl border p-4 flex items-center gap-3"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
            {room.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg truncate">{room.name}</h1>
            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{memberCount} members</p>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden flex rounded-xl overflow-hidden border mb-4"
          style={{ borderColor: "var(--border)" }}>
          {["threads", "chat"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as "threads" | "chat")}
              className="flex-1 py-2.5 text-sm font-medium transition-colors capitalize"
              style={{
                background: activeTab === tab ? "rgba(124,111,239,0.2)" : "var(--bg-card)",
                color: activeTab === tab ? "#a89cf8" : "var(--text-secondary)",
              }}>
              {tab === "threads" ? "Discussions" : "Live Chat"}
            </button>
          ))}
        </div>

        {/* Threads panel */}
        <div className={activeTab === "threads" ? "block" : "hidden lg:block"}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Discussions</h2>
            <CreateThreadModal roomId={room.id} user={serverUser} onCreated={refreshThreads} />
          </div>

          {threads.length === 0 ? (
            <div className="rounded-xl border p-12 text-center"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold mb-1">No discussions yet</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Be the first to start a conversation in this room!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} roomSlug={room.slug} />
              ))}
            </div>
          )}
        </div>

        {/* Mobile chat panel */}
        <div className={`lg:hidden ${activeTab === "chat" ? "block" : "hidden"}`}>
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)", height: "60vh" }}>
            <ChatPanel roomId={room.id} roomSlug={room.slug} user={serverUser} />
          </div>
        </div>
      </main>

      {/* RIGHT — chat panel (desktop only) */}
      <aside className="hidden lg:flex w-80 shrink-0">
        <div className="sticky top-20 w-full rounded-xl border overflow-hidden flex flex-col"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)", height: "calc(100vh - 88px)" }}>
          <ChatPanel roomId={room.id} roomSlug={room.slug} user={serverUser} />
        </div>
      </aside>
    </div>
  );
}
