'use server'

import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { generateId } from 'lucia'

import { env } from "@/env.mjs";
import { db } from '@/lib/db/index'
import { resend } from '@/lib/email'
import { Result } from '@/lib/types'
import { ResultCode, hashPassword } from '@/lib/utils'
import { VerificationTemplate } from '@/lib/email/templates/verification-template'

export async function createUser(
  email: string,
  hashedPassword: string,
  userId: string,
  verificationToken: string
) {
  const existingUser = await db.user.findUnique({
    where: { email: email }
  })

  if (existingUser) {
    return {
      type: 'error',
      resultCode: ResultCode.UserAlreadyExists
    }
  } else {
    try {
      await db.user.create({
        data: {
          id: userId,
          email: email,
          hashedPassword,
          verificationToken: verificationToken
        }
      })
    } catch (e) {
      return {
        type: 'error',
        resultCode: ResultCode.UnknownError
      }
    }

    return {
      type: 'success',
      resultCode: ResultCode.UserCreated
    }
  }
}

export async function signup(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

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
    
    const hashedPassword = await hashPassword(password)
    const userId = generateId(15)
    const verificationToken = generateId(6)
    
    const result = await createUser(email, hashedPassword, userId, verificationToken)
    
    if (result.type === 'success') {
      const token = jwt.sign(
        { email: email, userId, verificationToken },
        env.JWT_SECRET
      )
    
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${token}`
    
      const sendEmail = async () => {
        try {
          await resend.emails.send({
            from: 'ChatGPT Clone <onboarding@email.pritish.in>',
            to: [email],
            subject: 'ChapGPT Clone Verification',
            react: VerificationTemplate({ link: url }),
            text: 'Email powered by Resend.'
          })
        } catch (error) {
          return { error: 'Error sending email.' }
        }
      }
    
      await sendEmail()
      
      return {
        type: 'success',
        resultCode: ResultCode.VerificationEmailSent
      }
    }
    
    return {
      type: 'error',
      resultCode: result.resultCode
    }
  } else {
    return {
      type: 'error',
      resultCode: ResultCode.InvalidCredentials
    }
  }
}