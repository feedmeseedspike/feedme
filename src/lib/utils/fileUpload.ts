import { createClient } from "src/utils/supabase/client";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PDF and Word documents (.pdf, .doc, .docx) are allowed.'
    };
  }

  return { valid: true };
}

export async function uploadResume(file: File, candidateName: string): Promise<UploadResult> {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = createClient();

    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedName = candidateName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${sanitizedName}_resume.${fileExtension}`;
    const filePath = `resumes/${fileName}`;

    // Create a timeout promise that rejects after 10 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout - storage bucket may not exist')), 10000);
    });

    // Upload file to Supabase Storage with timeout
    const uploadPromise = supabase.storage
      .from('job-applications') // Make sure this bucket exists in your Supabase dashboard
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    let data, error;
    try {
      const result = await Promise.race([uploadPromise, timeoutPromise]);
      data = (result as any).data;
      error = (result as any).error;
    } catch (timeoutError) {
      console.error('Upload timed out:', timeoutError);
      return {
        success: false,
        error: 'Storage bucket not configured. Please contact administrator.'
      };
    }

    if (error) {
      console.error('Supabase Storage upload error:', error);

      // Check if bucket doesn't exist
      if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
        return {
          success: false,
          error: 'Storage bucket not configured. Please contact administrator.'
        };
      }

      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('job-applications')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl
    };

  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      success: false,
      error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function deleteResume(url: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // Extract file path from URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'job-applications');
    if (bucketIndex === -1) return false;

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from('job-applications')
      .remove([filePath]);

    return !error;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}