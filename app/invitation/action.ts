'use server'

import { lucia } from '@/lib/auth/lucia'
import { setAuthCookie } from '@/lib/auth/utils'
import { db } from '@/lib/db/index'
import { Result } from '@/lib/types'
import { ResultCode, hashPassword } from '@/lib/utils'
import { generateId } from 'lucia'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { addTeamMember } from '../actions'

export async function createUser(
  email: string,
  hashedPassword: string,
  userId: string
) {
  try {
    const user = await db.user.create({
      data: {
        id: userId,
        email: email,
        hashedPassword,
        verificationToken: null,
        isEmailVerified: true
      }
    })
    
    return user
  } catch (e) {
    return {
      type: 'error',
      resultCode: ResultCode.UnknownError
    }
  }
}

export async function authenticate(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
  try {
    const email = formData.get('email')
    const password = formData.get('password')
    const teamId = formData.get('teamId')
        
    const parsedCredentials = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        teamId: z.string().min(1)
      })
      .safeParse({
        email,
        password,
        teamId
      })

    if (parsedCredentials.success) {
      const email = parsedCredentials.data.email.toLowerCase()
      const password = parsedCredentials.data.password
      const teamId = Number(parsedCredentials.data.teamId)

      const hashedPassword = await hashPassword(password)
      const userId = generateId(15)
      
      const user = await createUser(email, hashedPassword, userId)
      
      if (user && 'type' in user) {
        return {
          type: 'error',
          resultCode: user.resultCode
        }
      }
      
      const e = await addTeamMember(teamId, user.id)
      if(e) {
        console.log(e.error)
      }
      
      const session = await lucia.createSession(user.id, {})
      const sessionCookie = lucia.createSessionCookie(session.id)
      setAuthCookie(sessionCookie)
      
      redirect('/')
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
