import { supabase } from '../config/supabase';

export interface Claim {
  id: string;
  post_id: string;
  claimer_id: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  message?: string | null;
  created_at: string;
}

export const createClaim = async (
  postId: string,
  claimerId: string,
  ownerId: string,
  message?: string
): Promise<{ data: Claim | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_d56ee_claims')
      .insert([
        {
          post_id: postId,
          claimer_id: claimerId,
          owner_id: ownerId,
          status: 'pending',
          message: message || null,
        },
      ])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateClaimStatus = async (
  claimId: string,
  status: 'approved' | 'rejected' | 'cancelled' | 'completed'
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('app_d56ee_claims')
      .update({
        status,
      })
      .eq('id', claimId);

    return { error };
  } catch (error) {
    return { error };
  }
};

export const getClaimsByPost = async (
  postId: string
): Promise<{ data: Claim[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_d56ee_claims')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

export const getUserClaims = async (
  userId: string
): Promise<{ data: Claim[]; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_d56ee_claims')
      .select('*')
      .eq('claimer_id', userId)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    return { data: [], error };
  }
};

export const getLatestClaimForPost = async (
  postId: string
): Promise<{ data: Claim | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('app_d56ee_claims')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};
