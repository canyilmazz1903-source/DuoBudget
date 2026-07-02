import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../api/supabase';

export interface ParsedPdfResult {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Lets the user select a PDF document using the native document picker.
 */
export const pickPdfFile = async (): Promise<DocumentPicker.DocumentPickerAsset | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('pickPdfFile Error:', error);
    return null;
  }
};

/**
 * Reads a local file URI and converts it to base64.
 */
export const readPdfAsBase64 = async (fileUri: string): Promise<string | null> => {
  try {
    const decodedUri = decodeURIComponent(fileUri);
    const base64 = await FileSystem.readAsStringAsync(decodedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('readPdfAsBase64 Error:', error);
    return null;
  }
};

/**
 * Sends a base64 encoded PDF to the Supabase Edge Function for text extraction.
 */
export const extractTextFromPdf = async (base64Data: string): Promise<ParsedPdfResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-pdf', {
      method: 'POST',
      body: { pdf_base64: base64Data },
    });

    if (error) {
      throw error;
    }

    if (data && data.text) {
      return {
        success: true,
        text: data.text,
      };
    }

    return {
      success: false,
      error: 'Edge Function metin döndürmedi.',
    };
  } catch (error: any) {
    console.error('extractTextFromPdf Error:', error);
    return {
      success: false,
      error: error.message || 'PDF işleme sırasında bir hata oluştu.',
    };
  }
};
