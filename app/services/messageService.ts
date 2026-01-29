import { supabase } from '../config/supabase';
import { Message, Conversation, GroupChat, GroupMember, TypingIndicator, MessageType } from '../types/message.types';
import { uploadImage, uploadFile } from './uploadService';

// ==================== CONVERSATIONS ====================

export const createConversation = async (
  postId: string,
  user1Id: string,
  user2Id: string
): Promise<{ data: Conversation | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_3f92f_conversations')
      .upsert([
        {
          post_id: postId,
          user1_id: user1Id,
          user2_id: user2Id,
        },
      ])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const getConversations = async (userId: string): Promise<{ data: Conversation[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_3f92f_conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

// ==================== MESSAGES ====================

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  messageType: MessageType = 'text',
  fileUrl?: string,
  fileName?: string,
  fileSize?: number,
  replyToMessageId?: string
): Promise<{ data: Message | null; error: any }> => {
  try {
    const messageData: any = {
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
      is_read: false,
    };

    if (fileUrl) messageData.file_url = fileUrl;
    if (fileName) messageData.file_name = fileName;
    if (fileSize) messageData.file_size = fileSize;
    if (replyToMessageId) messageData.reply_to_message_id = replyToMessageId;

    const { data, error } = await supabase
      .from('app_3f92f_messages')
      .insert([messageData])
      .select()
      .single();

    if (!error) {
      const lastMessage = messageType === 'text' ? content : 
                         messageType === 'image' ? '📷 Image' : 
                         '📎 File';
      
      await supabase
        .from('app_3f92f_conversations')
        .update({
          last_message: lastMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    }

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const sendImageMessage = async (
  conversationId: string,
  senderId: string,
  imageUri: string,
  caption: string = ''
): Promise<{ data: Message | null; error: any }> => {
  try {
    // Upload image first
    const uploadResult = await uploadImage(imageUri, senderId, conversationId);
    
    if (uploadResult.error || !uploadResult.url) {
      return { data: null, error: uploadResult.error || 'Upload failed' };
    }

    // Send message with image URL
    return await sendMessage(
      conversationId,
      senderId,
      caption,
      'image',
      uploadResult.url,
      uploadResult.path.split('/').pop(),
      undefined
    );
  } catch (error) {
    return { data: null, error };
  }
};

export const sendFileMessage = async (
  conversationId: string,
  senderId: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<{ data: Message | null; error: any }> => {
  try {
    // Upload file first
    const uploadResult = await uploadFile(fileUri, fileName, mimeType, senderId, conversationId);
    
    if (uploadResult.error || !uploadResult.url) {
      return { data: null, error: uploadResult.error || 'Upload failed' };
    }

    // Send message with file URL
    return await sendMessage(
      conversationId,
      senderId,
      fileName,
      'file',
      uploadResult.url,
      fileName,
      fileSize
    );
  } catch (error) {
    return { data: null, error };
  }
};

export const getMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ data: Message[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_3f92f_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

export const editMessage = async (
  messageId: string,
  newContent: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('app_3f92f_messages')
      .update({
        content: newContent,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const deleteMessage = async (messageId: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('app_3f92f_messages')
      .delete()
      .eq('id', messageId);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const searchMessages = async (
  conversationId: string,
  searchQuery: string
): Promise<{ data: Message[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_3f92f_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .ilike('content', `%${searchQuery}%`)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

// ==================== READ RECEIPTS ====================

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('app_3f92f_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const getUnreadCount = async (
  conversationId: string,
  userId: string
): Promise<{ count: number; error: any }> => {
  try {
    const { count, error } = await supabase
      .from('app_3f92f_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    return { count: count || 0, error };
  } catch (error) {
    return { count: 0, error };
  }
};

// ==================== TYPING INDICATORS ====================

export const setTypingIndicator = async (
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('app_3f92f_typing_indicators')
      .upsert({
        conversation_id: conversationId,
        user_id: userId,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      });

    return { error };
  } catch (error) {
    return { error };
  }
};

export const subscribeToTypingIndicators = (
  conversationId: string,
  currentUserId: string,
  callback: (isTyping: boolean, userId: string) => void
) => {
  return supabase
    .channel(`typing:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app_3f92f_typing_indicators',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload: any) => {
        const typingData = payload.new as TypingIndicator;
        if (typingData.user_id !== currentUserId) {
          callback(typingData.is_typing, typingData.user_id);
        }
      }
    )
    .subscribe();
};

// ==================== REALTIME SUBSCRIPTIONS ====================

export const subscribeToMessages = (
  conversationId: string,
  callback: (message: Message) => void
) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'app_3f92f_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();
};

// ==================== GROUP CHATS ====================

export const createGroupChat = async (
  name: string,
  description: string,
  createdBy: string,
  memberIds: string[]
): Promise<{ data: GroupChat | null; error: any }> => {
  try {
    // Create group
    const { data: groupData, error: groupError } = await supabase
      .from('app_3f92f_group_chats')
      .insert([
        {
          name,
          description,
          created_by: createdBy,
        },
      ])
      .select()
      .single();

    if (groupError || !groupData) {
      return { data: null, error: groupError };
    }

    // Add creator as admin
    const members = [
      {
        group_id: groupData.id,
        user_id: createdBy,
        role: 'admin',
      },
      // Add other members
      ...memberIds.map(userId => ({
        group_id: groupData.id,
        user_id: userId,
        role: 'member',
      })),
    ];

    const { error: membersError } = await supabase
      .from('app_3f92f_group_members')
      .insert(members);

    if (membersError) {
      return { data: null, error: membersError };
    }

    return { data: groupData, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getGroupChats = async (userId: string): Promise<{ data: GroupChat[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_3f92f_group_members')
      .select(`
        group_id,
        app_3f92f_group_chats (*)
      `)
      .eq('user_id', userId);

    if (error) return { data: [], error };

    const groups = data?.map((item: any) => item.app_3f92f_group_chats).filter(Boolean) || [];
    return { data: groups, error: null };
  } catch (error) {
    return { data: [], error };
  }
};

export const getGroupMembers = async (groupId: string): Promise<{ data: GroupMember[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_3f92f_group_members')
      .select('*')
      .eq('group_id', groupId);

    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

export const addGroupMember = async (
  groupId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('app_3f92f_group_members')
      .insert([
        {
          group_id: groupId,
          user_id: userId,
          role,
        },
      ]);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const removeGroupMember = async (
  groupId: string,
  userId: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('app_3f92f_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const updateGroupChat = async (
  groupId: string,
  updates: { name?: string; description?: string; avatar_url?: string }
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('app_3f92f_group_chats')
      .update(updates)
      .eq('id', groupId);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const deleteGroupChat = async (groupId: string): Promise<{ error: any }> => {
  try {
    // Delete all members first
    await supabase
      .from('app_3f92f_group_members')
      .delete()
      .eq('group_id', groupId);

    // Delete group
    const { error } = await supabase
      .from('app_3f92f_group_chats')
      .delete()
      .eq('id', groupId);

    return { error };
  } catch (error) {
    return { error };
  }
};