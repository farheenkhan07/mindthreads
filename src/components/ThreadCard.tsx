import Link from "next/link";
import { MessageSquare, Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Thread } from "@/types";

interface Props {
  thread: Thread & { reply_count?: number; author?: { username: string } | null };
  roomSlug: string;
}

export function ThreadCard({ thread, roomSlug }: Props) {
  return (
    <div className="card-glow rounded-xl border p-5 transition-all hover:border-purple-500/40"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-snug mb-2 line-clamp-2">
            {thread.title}
          </h3>
          <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--text-secondary)" }}>
            {thread.body}
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {thread.reply_count ?? 0} replies
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(thread.created_at)}
            </span>
            {thread.author?.username && (
              <span style={{ color: "#a89cf8" }}>by {thread.author.username}</span>
            )}
          </div>
        </div>
        <Link
          href={`/room/${roomSlug}/thread/${thread.id}`}
          className="shrink-0 text-xs px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-90 whitespace-nowrap"
          style={{ background: "rgba(124,111,239,0.2)", color: "#a89cf8" }}>
          Open Discussion
        </Link>
      </div>
    </div>
  );
}
