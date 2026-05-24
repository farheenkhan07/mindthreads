import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify, extractTopic } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "No text" }, { status: 400 });

  const topic = extractTopic(text.trim());
  const slug = slugify(topic);

  // Try to find existing room
  const { data: existing } = await supabase
    .from("rooms")
    .select("*")
    .eq("slug", slug)
    .single();

  if (existing) {
    return NextResponse.json({ room: existing, created: false });
  }

  // Create new room
  const { data: newRoom, error } = await supabase
    .from("rooms")
    .insert({
      name: topic.replace(/\b\w/g, (c) => c.toUpperCase()),
      slug,
      description: `A space to discuss everything about ${topic}.`,
      tags: topic.split(" ").filter(Boolean),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the thought (no user tracking required)
  await supabase.from("thoughts").insert({
    original_text: text.trim(),
    room_id: newRoom.id,
    user_id: null,
  });

  return NextResponse.json({ room: newRoom, created: true });
}
