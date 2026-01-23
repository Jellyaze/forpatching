import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../config/supabase';

export const uploadImage = async (
  uri: string,
  folder: string,
  userId: string
): Promise<string | null> => {
  try {
    const cleanUri = uri.split('?')[0];
    const fileExt = cleanUri.split('.').pop() || 'jpg';
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;

    // ✅ If Android returns content://, copy to a readable local file
    let fileUri = uri;
    if (uri.startsWith('content://')) {
      const targetUri = `${FileSystem.cacheDirectory}${Date.now()}.${fileExt}`;
      await FileSystem.copyAsync({ from: uri, to: targetUri });
      fileUri = targetUri;
    }

    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) {
      throw new Error(`File does not exist: ${fileUri}`);
    }

    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64) {
      throw new Error('Failed to read base64 from image');
    }

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { data, error } = await supabase.storage
      .from('app_d56ee_images')
      .upload(fileName, bytes, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('app_d56ee_images')
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};
