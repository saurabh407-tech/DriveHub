import { api } from './api';

export interface SendContactMessagePayload {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

export async function sendContactMessage(payload: SendContactMessagePayload): Promise<ContactResponse> {
  const response = await api.post<ContactResponse>('/contact', payload);
  return response.data;
}
