import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const [users, rooms, threads, messages] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("rooms").select("*", { count: "exact", head: true }),
      supabase.from("threads").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
    ]);
    return NextResponse.json({
      users: users.count ?? 0,
      rooms: rooms.count ?? 0,
      threads: threads.count ?? 0,
      messages: messages.count ?? 0,
    });
  } catch {
    return NextResponse.json({ users: 0, rooms: 0, threads: 0, messages: 0 });
  }
}
