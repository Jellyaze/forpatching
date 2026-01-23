import { supabase } from '../config/supabase';
import { uploadImage } from './authService';

export interface Post {
  id: string;
  user_id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location_name: string;
  latitude: number;
  longitude: number;
  date_lost_found: string;
  image_urls: string[];
  status: 'active' | 'claimed' | 'returned' | 'closed';
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export const createPost = async (
  postData: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'image_urls'>,
  imageUris: string[],
  userId: string
): Promise<{ data: Post | null; error: any }> => {
  try {
    // Upload images
    const imageUrls: string[] = [];
    for (const uri of imageUris) {
      const url = await uploadImage(uri, 'posts', userId);
      if (url) imageUrls.push(url);
    }

    const { data, error } = await supabase
      .from('app_d56ee_posts')
      .insert([
        {
          ...postData,
          image_urls: imageUrls,
        },
      ])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const updatePost = async (
  postId: string,
  postData: Partial<Post>,
  newImageUris?: string[],
  userId?: string
): Promise<{ error: any }> => {
  try {
    let updateData: any = { ...postData, updated_at: new Date().toISOString() };

    if (newImageUris && newImageUris.length > 0 && userId) {
      const imageUrls: string[] = [];
      for (const uri of newImageUris) {
        const url = await uploadImage(uri, 'posts', userId);
        if (url) imageUrls.push(url);
      }
      updateData.image_urls = imageUrls;
    }

    const { error } = await supabase
      .from('app_d56ee_posts')
      .update(updateData)
      .eq('id', postId);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const deletePost = async (postId: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('app_d56ee_posts')
      .delete()
      .eq('id', postId);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const getPosts = async (type?: 'lost' | 'found', status: string = 'active'): Promise<{ data: Post[]; error: any }> => {
  try {
    let query = supabase
      .from('app_d56ee_posts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

export const getPostById = async (postId: string): Promise<{ data: Post | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_d56ee_posts')
      .select('*')
      .eq('id', postId)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserPosts = async (userId: string): Promise<{ data: Post[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_d56ee_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

export const searchPosts = async (
  searchQuery: string,
  type?: 'lost' | 'found',
  category?: string
): Promise<{ data: Post[]; error: any }> => {
  try {
    let query = supabase
      .from('app_d56ee_posts')
      .select('*')
      .eq('status', 'active')
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};