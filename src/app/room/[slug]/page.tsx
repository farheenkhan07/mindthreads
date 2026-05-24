import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoomClient } from "./RoomClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!room) notFound();

  const { data: threads } = await supabase
    .from("threads")
    .select("*, author:profiles(id, username, avatar_url, created_at), reply_count:replies(count)")
    .eq("room_id", room.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: { user } } = await supabase.auth.getUser();

  // Member count
  const { count: memberCount } = await supabase
    .from("room_members")
    .select("*", { count: "exact", head: true })
    .eq("room_id", room.id);

  // Track membership
  if (user) {
    await supabase.from("room_members").upsert(
      { room_id: room.id, user_id: user.id, last_seen_at: new Date().toISOString() },
      { onConflict: "room_id,user_id" }
    );
  }

  const formattedThreads = (threads ?? []).map((t) => ({
    ...t,
    reply_count: Array.isArray(t.reply_count) ? t.reply_count[0]?.count ?? 0 : (t.reply_count ?? 0),
  }));

  return (
    <RoomClient
      room={room}
      initialThreads={formattedThreads}
      memberCount={memberCount ?? 0}
      serverUser={user}
    />
  );
}
