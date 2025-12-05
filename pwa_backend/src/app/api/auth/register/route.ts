import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { withCors } from '@/lib/cors';

export async function POST(req: NextRequest) {
    console.log("REGISTER_ROUTE_HIT", req);
    try {
        const { email, password, firstName, lastName } = await req.json();

        if (!firstName || !lastName || !email || !password) {
            const res = NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
            return withCors(req, res);
        }

        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existing) {
            const res = NextResponse.json({ error: 'User already exists' }, { status: 409 });
            return withCors(req, res);
        }

        const hashed = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email: email.toLowerCase(),
                password: hashed,
            }
        })

        let token: string | null = null;
        try {
            token = await createSession(user.id, user.role);
        } catch (err) {
            console.error('SESSION_CREATE_ERROR', err);
        }

        const res = NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    lastLogin: user.lastLogin,
                },
                token,
            },
            { status: 201 }
        );
        return withCors(req, res);
    } catch (error) {
        console.log(error, "ERROR_REGISTERING_USER");
        const res = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        return withCors(req, res);
    }
}