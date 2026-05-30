import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("threads")
      .select(`
        id, title, body, created_at,
        author:profiles(id, username),
        room:rooms(name, slug),
        reply_count:replies(count)
      `)
      .order("created_at", { ascending: false })
      .limit(9);

    if (error) return NextResponse.json([], { status: 200 });

    const threads = (data ?? []).map((t) => ({
      ...t,
      reply_count: Array.isArray(t.reply_count)
        ? (t.reply_count[0] as { count: number })?.count ?? 0
        : (t.reply_count as unknown as number) ?? 0,
    }));

    return NextResponse.json(threads);
  } catch {
    return NextResponse.json([]);
  }
}
