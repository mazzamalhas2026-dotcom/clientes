import { cookies } from 'next/headers';
import { decrypt } from './session';

export async function verifySession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) return null;
    
    const session = await decrypt(sessionCookie);
    return session;
  } catch (error) {
    return null;
  }
}
