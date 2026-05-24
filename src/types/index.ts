export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  member_count?: number;
  online_count?: number;
}

export interface Thread {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  reply_count?: number;
  author?: Profile | null;
}

export interface Reply {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: Profile | null;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: Profile | null;
}

export interface Thought {
  id: string;
  user_id: string | null;
  original_text: string;
  room_id: string;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  last_seen_at: string;
  created_at: string;
}
