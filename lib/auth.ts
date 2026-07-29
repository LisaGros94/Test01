// Auth. In production this is Google Workspace SSO locked to the @blanche
// domain (NextAuth). With no Google credentials configured the app runs in
// "demo mode": the current user comes from a cookie you can switch in the UI,
// so you can experience self-suppression, handoffs and mentions as any teammate.

import { cookies } from 'next/headers';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? 'blanche.xyz';
export const DEMO_MODE = !process.env.GOOGLE_CLIENT_ID;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: { params: { hd: ALLOWED_DOMAIN } },
    }),
  ],
  callbacks: {
    // Hard gate: only @blanche Workspace accounts may sign in.
    async signIn({ user }) {
      return !!user.email && user.email.endsWith(`@${ALLOWED_DOMAIN}`);
    },
    async session({ session }) {
      return session;
    },
  },
  pages: { signIn: '/signin' },
};

const DEMO_COOKIE = 'demo_uid';
const DEFAULT_DEMO_USER = 'lisa';

/**
 * The acting user id for the current request. Demo mode reads the cookie;
 * production would resolve it from the NextAuth session email → user row.
 */
export async function getCurrentUserId(): Promise<string> {
  const store = await cookies();
  return store.get(DEMO_COOKIE)?.value ?? DEFAULT_DEMO_USER;
}

export { DEMO_COOKIE };
