"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, MessageSquare, Send, Loader2, Lock, Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Thread, Reply, Room, Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

interface Props {
  thread: Thread & { author: Profile | null };
  replies: (Reply & { author: Profile | null })[];
  room: Room | null;
  relatedThreads: { id: string; title: string; created_at: string }[];
  serverUser: User | null;
  slug: string;
}

export function ThreadDetailClient({ thread, replies: initialReplies, room, relatedThreads, serverUser, slug }: Props) {
  const supabase = createClient();
  const [replies, setReplies] = useState(initialReplies);
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !serverUser) return;
    setLoading(true); setError("");
    const { data, error: err } = await supabase
      .from("replies")
      .insert({ thread_id: thread.id, user_id: serverUser.id, body: replyBody.trim() })
      .select("*, author:profiles(id, username, avatar_url, created_at)")
      .single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    setReplies((prev) => [...prev, data as Reply & { author: Profile | null }]);
    setReplyBody("");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <Link href={`/room/${slug}`}
          className="inline-flex items-center gap-2 text-sm mb-6 hover:text-purple-400 transition-colors"
          style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" />
          Back to {room?.name ?? "Room"}
        </Link>

        {/* Thread */}
        <div className="rounded-2xl border p-6 mb-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h1 className="text-2xl font-bold mb-3 leading-snug">{thread.title}</h1>
          <div className="flex items-center gap-3 mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "#a89cf8" }}>@{thread.author?.username ?? "anonymous"}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(thread.created_at)}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{replies.length} replies</span>
          </div>
          <p className="leading-relaxed whitespace-pre-wrap">{thread.body}</p>
        </div>

        {/* Replies */}
        <div className="space-y-4 mb-8">
          <h2 className="font-bold text-lg">{replies.length} Replies</h2>
          {replies.length === 0 && (
            <div className="rounded-xl border p-8 text-center"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              No replies yet. Be the first to respond!
            </div>
          )}
          {replies.map((reply) => (
            <div key={reply.id} className="rounded-xl border p-4 flex gap-3"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                {(reply.author?.username ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span className="text-sm font-semibold" style={{ color: "#a89cf8" }}>
                    @{reply.author?.username ?? "anonymous"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {timeAgo(reply.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply form */}
        {serverUser ? (
          <form onSubmit={submitReply} className="rounded-xl border p-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="font-semibold mb-3">Add a Reply</h3>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Share your thoughts…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl resize-none outline-none focus:ring-1 focus:ring-purple-500 mb-3"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={loading || !replyBody.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post Reply
              </button>
            </div>
          </form>
        ) : (
          <Link href="/auth"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border text-sm transition-colors hover:border-purple-500/50"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            <Lock className="w-4 h-4" /> Sign in to reply
          </Link>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="sticky top-20 space-y-4">
          {room && (
            <div className="rounded-xl border p-4"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>ROOM</p>
              <Link href={`/room/${slug}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                  {room.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{room.name}</p>
                  <p className="text-xs" style={{ color: "#a89cf8" }}>View room →</p>
                </div>
              </Link>
            </div>
          )}

          {relatedThreads.length > 0 && (
            <div className="rounded-xl border p-4"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>RELATED DISCUSSIONS</p>
              <div className="space-y-3">
                {relatedThreads.map((t) => (
                  <Link key={t.id} href={`/room/${slug}/thread/${t.id}`}
                    className="block text-sm hover:text-purple-400 transition-colors line-clamp-2 leading-snug"
                    style={{ color: "var(--text-secondary)" }}>
                    {t.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
