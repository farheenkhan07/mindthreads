import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify, extractTopic } from "@/lib/utils";
import OpenAI from "openai";

async function aiMatchRoom(
  text: string,
  rooms: { slug: string; name: string; description: string | null; tags: string[] }[]
): Promise<{ action: "match" | "create"; slug?: string; topic?: string; name?: string; description?: string; tags?: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("no key");

  const openai = new OpenAI({ apiKey });
  const roomList = rooms.map((r) => `slug:"${r.slug}" name:"${r.name}" tags:[${r.tags.join(",")}]`).join("\n");

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a room-matching assistant for MindThreads, a community platform.
Given a user's thought/query, decide if it best matches one of the existing rooms or needs a new room.

Existing rooms:
${roomList}

Rules:
- If the user's intent clearly matches an existing room (even loosely), return action "match" with that room's slug.
- Only return action "create" if NO existing room fits at all.
- When creating, generate a concise room name (2-4 words, title case), a one-sentence description, and 3-5 lowercase tag strings.

Respond ONLY with valid JSON:
{ "action": "match", "slug": "existing-slug" }
OR
{ "action": "create", "topic": "kebab-case-slug", "name": "Room Name", "description": "One sentence.", "tags": ["tag1","tag2"] }`,
      },
      { role: "user", content: text },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "No text" }, { status: 400 });

  // Fetch all rooms for AI matching
  const { data: allRooms } = await supabase
    .from("rooms")
    .select("id, slug, name, description, tags");

  let targetRoom = null;
  let created = false;

  // Try AI matching first
  try {
    const result = await aiMatchRoom(text.trim(), allRooms ?? []);

    if (result.action === "match" && result.slug) {
      targetRoom = (allRooms ?? []).find((r) => r.slug === result.slug) ?? null;
    }

    if (result.action === "create" || !targetRoom) {
      const slug = result.topic ? slugify(result.topic) : slugify(extractTopic(text.trim()));
      // Check if slug already exists
      const { data: existing } = await supabase.from("rooms").select("*").eq("slug", slug).single();
      if (existing) {
        targetRoom = existing;
      } else {
        const { data: newRoom, error } = await supabase
          .from("rooms")
          .insert({
            name: result.name ?? extractTopic(text.trim()).replace(/\b\w/g, (c) => c.toUpperCase()),
            slug,
            description: result.description ?? `A space to discuss everything about ${result.topic ?? extractTopic(text.trim())}.`,
            tags: result.tags ?? extractTopic(text.trim()).split(" ").filter(Boolean),
          })
          .select()
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        targetRoom = newRoom;
        created = true;
      }
    }
  } catch {
    // Fallback: keyword extraction
    const topic = extractTopic(text.trim());
    const slug = slugify(topic);
    const { data: existing } = await supabase.from("rooms").select("*").eq("slug", slug).single();
    if (existing) {
      targetRoom = existing;
    } else {
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
      targetRoom = newRoom;
      created = true;
    }
  }

  // Log the thought
  if (targetRoom) {
    await supabase.from("thoughts").insert({
      original_text: text.trim(),
      room_id: targetRoom.id,
      user_id: null,
    });
  }

  return NextResponse.json({ room: targetRoom, created });
}
