import { SignJWT, jwtVerify } from 'jose'

export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt'
const key = new TextEncoder().encode(JWT_SECRET)

export async function signToken(payload: { id: string; role: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key)
    return payload as { id: string; role: string; email: string }
  } catch (error) {
    return null
  }
}

import { cookies } from 'next/headers'

export async function verifyAuth(req?: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return null
    return await verifyToken(token)
  } catch (error) {
    return null
  }
}
