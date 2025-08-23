"use server";

import jwt from 'jsonwebtoken';

export async function verifyToken(token: string): Promise<{ valid: boolean; payload?: any }> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const payload = jwt.verify(token, secret);
    return { valid: true, payload };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { valid: false };
  }
}
