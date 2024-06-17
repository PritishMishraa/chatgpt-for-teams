'use server'

import { Result } from '@/lib/types'
import { db } from '@/lib/db/index'
import { lucia, validateRequest } from '@/lib/auth/lucia'
import { setAuthCookie } from '@/lib/auth/utils'
import { ResultCode, comparePasswords } from '@/lib/utils'
import { z } from 'zod'
import { redirect } from 'next/navigation'

export async function login(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
  try {
    const email = formData.get('email')
    const password = formData.get('password')

    const parsedCredentials = z
      .object({
        email: z.string().email(),
        password: z.string().min(6)
      })
      .safeParse({
        email,
        password
      })

    if (parsedCredentials.success) {
      const email = parsedCredentials.data.email.toLowerCase()
      const password = parsedCredentials.data.password

      const existingUser = await db.user.findUnique({
        where: { email: email }
      })
      if (!existingUser) {
        return {
          type: 'error',
          resultCode: ResultCode.InvalidCredentials
        }
      }

      const validPassword = await comparePasswords(password, existingUser.hashedPassword)
      
      if (!validPassword) {
        return {
          type: 'error',
          resultCode: ResultCode.InvalidCredentials
        }
      }

      const isEmailVerified = await db.user.findFirst({
        where: {
          email: email,
          isEmailVerified: true
        }
      })
      if (!isEmailVerified) {
        return {
          type: 'error',
          resultCode: ResultCode.EmailNotVerified
        }
      }

      const session = await lucia.createSession(existingUser.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)
      setAuthCookie(sessionCookie)

      return {
        type: 'success',
        resultCode: ResultCode.UserLoggedIn
      }
    } else {
      return {
        type: 'error',
        resultCode: ResultCode.InvalidCredentials
      }
    }
  } catch (error) {
    return {
      type: 'error',
      resultCode: ResultCode.InvalidCredentials
    }
  }
}

export async function signOut() {
  const { session } = await validateRequest()
  
  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  await lucia.invalidateSession(session.id)
  const sessionCookie = lucia.createBlankSessionCookie()
  setAuthCookie(sessionCookie)
  
  redirect('/login')
}
