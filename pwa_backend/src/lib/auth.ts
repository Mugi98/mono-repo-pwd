import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { redis } from './redis';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET!;
const SESSION_TTL_SECONDS = 60 * 60 * 24;

export type JwtPayload = {
    sub: string;
    role: Role;
    sid: string;
    iat: number;
    exp: number;
}

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET missing in environment');
}

export async function hashPassword(password: string){
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}


export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, role: Role){
    const sid = crypto.randomUUID();
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: userId,
    role,
    sid,
  };
    const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '24h'});
    
    try{
        await redis.set(
        `session: ${sid}`,
        JSON.stringify({userId, role}),
        'EX',
        SESSION_TTL_SECONDS,
    );
    }catch(error){
        console.error('REDIS_SESSION_ERROR', error);
    }

    return token;
}

export async function revokeSession(sid: string){
    await redis.del(`session:${sid}`);
}

export async function verifyToken(token?: string): Promise<JwtPayload | null>{
    if(!token){
        return null;
    }
    try{
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        // const session = await redis.get(`session:${decoded.sid}`);
        // if(!session){
        //     return null;
        // }
        return decoded;
    }catch{
        return null;
    }
}