import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export interface EnhanceTextParams {
  text: string;
  type?: 'headline' | 'bio' | 'summary' | 'experience' | 'project' | string;
  context?: Record<string, string>;
}

export const aiService = {
  /**
   * Enhances text using Gemini AI via the existing Firebase Cloud Function `enhanceText`.
   */
  async enhanceText(params: EnhanceTextParams): Promise<string> {
    const rawText = params.text.trim();
    if (!rawText) return '';

    try {
      const callable = httpsCallable<Record<string, unknown>, { enhancedText?: string }>(
        functions,
        'enhanceText'
      );
      const res = await callable({
        text: rawText,
        type: params.type || 'summary',
        context: params.context || {},
      });

      const enhanced = res.data?.enhancedText;
      if (enhanced && typeof enhanced === 'string') {
        return enhanced.trim();
      }
      return rawText;
    } catch (err) {
      console.error('[aiService] enhanceText Cloud Function error:', err);
      throw new Error('AI text enhancement is currently unavailable. Please try again.');
    }
  },

  /**
   * Recommends related skills based on candidate's current skills via `getRelatedSkills` Cloud Function.
   */
  async getRelatedSkills(currentSkills: string[]): Promise<string[]> {
    if (!currentSkills || currentSkills.length === 0) return [];

    try {
      const callable = httpsCallable<{ currentSkills: string[] }, { relatedSkills?: string[] }>(
        functions,
        'getRelatedSkills'
      );
      const res = await callable({ currentSkills });

      const list = res.data?.relatedSkills;
      if (Array.isArray(list)) {
        return list
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0 && !currentSkills.includes(s))
          .slice(0, 8);
      }
      return [];
    } catch (err) {
      console.warn('[aiService] getRelatedSkills notice:', err);
      return [];
    }
  },
};
