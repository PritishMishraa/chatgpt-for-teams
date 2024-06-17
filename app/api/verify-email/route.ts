import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { lucia } from '@/lib/auth/lucia'
import { setAuthCookie } from '@/lib/auth/utils'
import { env } from '@/env.mjs'

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url)

    const searchParams = url.searchParams

    const token = searchParams.get('token')

    if (!token) {
      return Response.json(
        {
          error: 'Token is not existed'
        },
        {
          status: 400
        }
      )
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      email: string
      code: string
      userId: string
    }

    const emailVerificationQueryResult = await db.user.findFirst({
      where: {
        email: decoded.email,
        id: decoded.userId,
        verificationToken: decoded.code
      }
    })

    if (!emailVerificationQueryResult) {
      return Response.json(
        {
          error: 'Invalid token'
        },
        {
          status: 400
        }
      )
    }

    await db.user.update({
      where: {
        email: decoded.email,
        id: decoded.userId
      },
      data: {
        isEmailVerified: true,
        verificationToken: null
      }
    })

    const session = await lucia.createSession(decoded.userId, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    setAuthCookie(sessionCookie)

    return Response.redirect(
      new URL(env.NEXT_PUBLIC_BASE_URL),
      302
    )
  } catch (e: any) {
    console.error(e)
    return Response.json(
      {
        error: e.message
      },
      {
        status: 400
      }
    )
  }
}
