import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'segredo-padrao-super-secreto-malharia-2026');

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // expiração de 1 dia para o MVP
    .sign(SECRET);
}

export async function decrypt(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}
