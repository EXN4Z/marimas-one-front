import api from './axios';
import type { User } from '../types/user';

interface AuthResponse {
  user: User;
  token: string;
}

interface RegisterResponse {
  message: string;
  registration_id: string;
}

export const login = async (loginIdentifier: string, password: string): Promise<AuthResponse> => {
  const res = await api.post('/login', { login: loginIdentifier, password });
  return res.data;
};

export const register = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  password_confirmation: string
): Promise<RegisterResponse> => {
  const res = await api.post('/register', { name, email, phone, password, password_confirmation });
  return res.data;
};

export const verifyOtp = async (registration_id: string, otp_code: string): Promise<AuthResponse> => {
  const res = await api.post('/verify-otp', { registration_id, otp_code });
  return res.data;
};

export const resendOtp = async (registration_id: string): Promise<{ message: string }> => {
  const res = await api.post('/resend-otp', { registration_id });
  return res.data;
};
