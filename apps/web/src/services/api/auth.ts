import { LoginSchema, RegisterSchema } from '@nhatroso/shared';
import { z } from 'zod';

export async function login(data: z.infer<typeof LoginSchema>) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.code || 'UNKNOWN_ERROR');
  }

  return response.ok;
}

export async function register(data: z.infer<typeof RegisterSchema>) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.code || 'UNKNOWN_ERROR');
  }

  return response.ok;
}

export async function requestForgotPasswordOtp(email: string) {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.code || 'UNKNOWN_ERROR');
  }

  return response.ok;
}

export async function verifyForgotPasswordOtp(email: string, otp: string) {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });

  if (!response.ok) {
    const data = await response.json();
    const errorCode =
      typeof data?.error === 'string'
        ? data.error
        : data?.error?.code || 'SERVER_ERROR';
    // Throwing just the errorCode so UI can inject translation
    throw new Error(errorCode);
  }

  const resData = await response.json();
  return resData.reset_token as string;
}

export async function resetPassword(resetToken: string, password: string) {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reset_token: resetToken,
      password,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.code || 'UNKNOWN_ERROR');
  }

  return response.ok;
}
