export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_message_id?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  read_by?: ReadReceipt[];
  sender_profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface ReadReceipt {
  user_id: string;
  read_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  unread_count?: number;
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  last_message?: string;
  last_message_at?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}

export interface FileAttachment {
  uri: string;
  name: string;
  type: string;
  size: number;
}