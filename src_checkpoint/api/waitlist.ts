import axios from 'axios';
import { apiClient } from './client';
import type { WaitlistFormData } from '../types/forms';

export interface WaitlistResponse {
  success: boolean;
  message: string;
  id?: string;
}

export const submitWaitlist = async (
  data: WaitlistFormData
): Promise<WaitlistResponse> => {
  try {
    const response = await apiClient.post<WaitlistResponse>('/api/waitlist', {
      ...data,
      timestamp: new Date().toISOString(),
      source: 'website',
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as { message?: string };
      throw new Error(data.message || 'Failed to submit waitlist request');
    }
    throw new Error(
      'Network error. Please check your connection and try again.'
    );
  }
};
