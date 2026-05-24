import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThreadDetailClient } from "./ThreadDetailClient";

interface Props {
  params: Promise<{ slug: string; threadId: string }>;
}

export default async function ThreadPage({ params }: Props) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("threads")
    .select("*, author:profiles(id, username, avatar_url, created_at)")
    .eq("id", threadId)
    .single();

  if (!thread) notFound();

  const { data: replies } = await supabase
    .from("replies")
    .select("*, author:profiles(id, username, avatar_url, created_at)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("slug", slug)
    .single();

  const { data: relatedThreads } = await supabase
    .from("threads")
    .select("id, title, created_at")
    .eq("room_id", thread.room_id)
    .neq("id", threadId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ThreadDetailClient
      thread={thread}
      replies={replies ?? []}
      room={room}
      relatedThreads={relatedThreads ?? []}
      serverUser={user}
      slug={slug}
    />
  );
}
