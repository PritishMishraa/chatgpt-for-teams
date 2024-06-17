import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { getUserAuth } from '@/lib/auth/utils'
import { env } from '@/env.mjs'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

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
      teamId: number
    }

    const { session } = await getUserAuth()

    if (!session) {
      return Response.redirect(
        new URL(env.NEXT_PUBLIC_BASE_URL + `/invitation?token=${token}`),
        302
      )
    }

    const team = await db.team.findFirst({
      where: {
        id: decoded.teamId
      }
    })

    if (!team) {
      return Response.json(
        {
          error: 'Invalid token'
        },
        {
          status: 400
        }
      )
    }

    try {
      await db.teamMember.create({
        data: {
          teamId: decoded.teamId,
          userId: session.user.id,
          role: 'MEMBER'
        }
      });
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        return Response.json(
          {
            error: 'You are already a member of this team'
          },
          {
            status: 400
          }
        )
      }
    }

    return Response.redirect(new URL(env.NEXT_PUBLIC_BASE_URL), 302)
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
