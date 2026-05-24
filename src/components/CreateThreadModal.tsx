"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, PenSquare } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Props {
  roomId: string;
  user: User | null;
  onCreated: () => void;
}

export function CreateThreadModal({ roomId, user, onCreated }: Props) {
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getClient = () => {
    if (!clientRef.current) clientRef.current = createClient();
    return clientRef.current;
  };
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !user) return;
    setLoading(true); setError("");
    const { error } = await getClient().from("threads").insert({
      room_id: roomId,
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setTitle(""); setBody("");
    setOpen(false);
    onCreated();
  };

  if (!user) {
    return (
      <a href="/auth"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
        style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
        <PenSquare className="w-4 h-4" /> Start a Discussion
      </a>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
        <PenSquare className="w-4 h-4" /> Start a Discussion
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-lg rounded-2xl border shadow-2xl"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--border)" }}>
              <h2 className="font-bold text-lg">Start a Discussion</h2>
              <button onClick={() => setOpen(false)} className="hover:opacity-70 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your question or topic?"
                  maxLength={200}
                  required autoFocus
                  className="w-full px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share your thoughts, question, or experience…"
                  rows={5}
                  required
                  className="w-full px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-purple-500 resize-none transition-all"
                  style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading || !title.trim() || !body.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Post Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
