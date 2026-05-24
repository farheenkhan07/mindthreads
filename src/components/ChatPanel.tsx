"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Lock } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Message, Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

interface Props {
  roomId: string;
  roomSlug: string;
  user: User | null;
}

interface MessageWithAuthor extends Message {
  author: Profile | null;
}

export function ChatPanel({ roomId, user }: Props) {
  const instanceId = useId().replace(/:/g, "");
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getClient = useCallback(() => {
    if (!clientRef.current) clientRef.current = createClient();
    return clientRef.current;
  }, []);
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load initial messages
  useEffect(() => {
    getClient()
      .from("messages")
      .select("*, author:profiles(id, username, avatar_url, created_at)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        setMessages((data as MessageWithAuthor[]) ?? []);
        setTimeout(scrollToBottom, 100);
      });
  }, [roomId, getClient, scrollToBottom]);

  // Subscribe to new messages
  useEffect(() => {
    const sb = getClient();
    const channel = sb
      .channel(`room:${roomId}:messages:${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { data: author } = await sb
            .from("profiles")
            .select("*")
            .eq("id", payload.new.user_id)
            .single();
          setMessages((prev) => [
            ...prev,
            { ...(payload.new as Message), author: author ?? null },
          ]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [roomId, instanceId, getClient, scrollToBottom]);

  // Track online presence
  useEffect(() => {
    if (!user) return;
    const sb = getClient();
    const channel = sb.channel(`room:${roomId}:presence:${instanceId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => { sb.removeChannel(channel); };
  }, [roomId, instanceId, user, getClient]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || sending) return;
    setSending(true);
    await getClient().from("messages").insert({
      room_id: roomId,
      user_id: user.id,
      body: input.trim(),
    });
    setInput("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: "var(--border)" }}>
        <span className="font-semibold text-sm">Live Chat</span>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="w-2 h-2 rounded-full bg-green-400 pulse inline-block" />
          {onlineCount} online
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8" style={{ color: "var(--text-secondary)" }}>
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">Be the first to say something!</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="msg-appear">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
                {(msg.author?.username ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: "#a89cf8" }}>
                    {msg.author?.username ?? "Anonymous"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {timeAgo(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm break-words leading-relaxed mt-0.5">{msg.body}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
        {user ? (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Say something…"
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <button type="submit" disabled={!input.trim() || sending}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
              style={{ background: "linear-gradient(135deg, #7c6fef, #4facde)" }}>
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        ) : (
          <a href="/auth"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm border transition-colors hover:border-purple-500/50"
            style={{ background: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            <Lock className="w-4 h-4" /> Sign in to chat
          </a>
        )}
      </div>
    </div>
  );
}
