'use server'

import { env } from '@/env.mjs'
import { validateRequest } from '@/lib/auth/lucia'
import { getUserAuth } from '@/lib/auth/utils'
import { db } from '@/lib/db'
import { resend } from '@/lib/email'
import { InvitationTemplate } from '@/lib/email/templates/invitation-template'
import { type Chat } from '@/lib/types'
import { kv } from '@vercel/kv'
import jwt from 'jsonwebtoken'
import { revalidatePath } from 'next/cache'
import { redirect, useRouter } from 'next/navigation'
import { z } from 'zod'

export async function getChats(userId?: string | null) {
  const { user } = await validateRequest()
  const currentTeamId = user?.currentTeamId

  if (!currentTeamId && !userId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()
    const chats: string[] = await kv.zrange(
      `team:${currentTeamId}:chats`,
      0,
      -1,
      {
        rev: true
      }
    )

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const { user } = await validateRequest()

  if (!user?.currentTeamId || !userId) {
    return null
  }

  const teamId = user.currentTeamId
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat) {
    return null
  }

  const chatExistsInTeam = await kv.zscore(`team:${teamId}:chats`, `chat:${id}`)

  if (chatExistsInTeam === null) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const { session } = await getUserAuth()
  const { user } = await validateRequest()

  if (!session || !user?.currentTeamId) {
    return {
      error: 'Unauthorized'
    }
  }

  const teamId = user.currentTeamId

  const chatExistsInTeam = await kv.zscore(`team:${teamId}:chats`, `chat:${id}`)

  if (chatExistsInTeam === null) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`team:${teamId}:chats`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const { session } = await getUserAuth()
  const { user } = await validateRequest()

  if (!session?.user?.id || !user?.currentTeamId) {
    return {
      error: 'Unauthorized'
    }
  }

  const teamId = user.currentTeamId

  const chats: string[] = await kv.zrange(`team:${teamId}:chats`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }

  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`team:${teamId}:chats`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function saveChat(chat: Chat) {
  const { session } = await getUserAuth()
  const { user } = await validateRequest()
  
  if (session && session.user && user?.currentTeamId) {
    const pipeline = kv.pipeline()
    const teamId = user.currentTeamId

    const chatExists = await kv.exists(`chat:${chat.id}`)
    if(!chatExists) {
      await deductCreditFromTeam(teamId);
    }
    
    const currentCredits = await getCreditsForTeam(teamId);
    
    if (currentCredits <= 0) {
      return {
        error: 'Insufficient credits'
      };
    }
    
    pipeline.hmset(`chat:${chat.id}`, chat)
    pipeline.zadd(`team:${teamId}:chats`, {
      score: Date.now(),
      member: `chat:${chat.id}`
    })
    
    await pipeline.exec()
  } else {
    return
  }
}

export async function refreshHistory(path: string) {
  redirect(path)
}

export async function getMissingKeys() {
  const keysRequired = ['OPENAI_API_KEY']
  return keysRequired
    .map(key => (process.env[key] ? '' : key))
    .filter(key => key !== '')
}

export async function getTeams() {
  const { session } = await getUserAuth()

  if (!session) {
    return []
  }

  const teamsAsOwner = await db.team.findMany({
    where: {
      ownerId: session.user.id
    }
  })

  const teamsAsMember = await db.teamMember.findMany({
    where: {
      userId: session.user.id
    },
    select: {
      team: true
    }
  })

  let teams = teamsAsOwner.map(team => ({
    ...team,
    isOwner: true
  }))

  teams = teams.concat(
    teamsAsMember.map(team => ({
      ...team.team,
      isOwner: false
    }))
  )

  return teams
}

export type Teams = Awaited<ReturnType<typeof getTeams>>

export async function createTeam(name: string) {
  const { session } = await getUserAuth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const team = await db.team.create({
    data: {
      name,
      ownerId: session.user.id,
      creditWallet: {
        create: {
          balance: 10
        }
      }
    }
  })

  return team
}

export async function getTeamMembers(teamId: number) {
  if (teamId == -1) return []

  const members = await db.teamMember.findMany({
    where: {
      teamId: teamId
    },
    select: {
      user: true
    }
  })

  return members
}

export type TeamMembers = Awaited<ReturnType<typeof getTeamMembers>>

export async function getTeamOwnerEmail(teamId: number) {
  const team = await db.team.findUnique({
    where: {
      id: teamId
    },
    select: {
      owner: true
    }
  })

  if (!team) {
    return ''
  }

  return team.owner.email
}

export async function inviteTeamMember(teamId: number, email: string) {
  const { session } = await getUserAuth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const team = await db.team.findUnique({
    where: {
      id: teamId
    },
    include: {
      owner: true
    }
  })

  if (!team) {
    return {
      error: 'Team not found'
    }
  }

  if (team.ownerId === session.user.id && team.owner.email === email) {
    return {
      error: 'You can not invite yourself to the team!'
    }
  }

  const existingMember = await getTeamMembers(teamId)
  if (existingMember.some(member => member.user.email === email)) {
    return {
      error: 'User is already a member of the team'
    }
  }

  const emailSchema = z.string().email()
  try {
    emailSchema.parse(email)
  } catch (error) {
    return {
      error: 'Invalid email'
    }
  }

  const token = jwt.sign({ email: email, teamId: teamId }, env.JWT_SECRET)

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/invitation?token=${token}`

  const sendEmail = async () => {
    try {
      await resend.emails.send({
        from: 'ChatGPT Clone <onboarding@email.pritish.in>',
        to: [email],
        subject: 'ChapGPT Clone Invitation',
        react: InvitationTemplate({ link: url }),
        text: 'Email powered by Resend.'
      })
    } catch (error) {
      return { error: 'Error sending email.' }
    }
  }

  await sendEmail()
}

export async function addTeamMember(teamId: number, userId: string) {
  const numberOfMembers = await db.teamMember.count({
    where: {
      teamId: teamId
    }
  })

  if (numberOfMembers == 5) {
    return {
      error: 'Team is full'
    }
  }

  try {
    await db.teamMember.create({
      data: {
        teamId: teamId,
        userId: userId,
        role: 'MEMBER'
      }
    })
  } catch (error) {
    return {
      error: 'Error adding team member'
    }
  }
}

export async function setCurrTeamId(teamId: number) {
  const { session } = await getUserAuth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  await db.user.update({
    where: {
      id: session.user.id
    },
    data: {
      currentTeamId: teamId
    }
  })
}

export async function getCreditsForTeam(teamId: number) {
  if (teamId == -1) return 0

  const teamCredits = await db.team.findUnique({
    where: {
      id: teamId
    },
    select: {
      creditWallet: true
    }
  })

  if (!teamCredits || !teamCredits.creditWallet) {
    return 0
  }

  return teamCredits.creditWallet.balance
}

export async function deductCreditFromTeam(teamId: number) {
  if (teamId == -1) return
  
  await db.team.update({
    where: {
      id: teamId
    },
    data: {
      creditWallet: {
        update: {
          balance: {
            decrement: 1
          }
        }
      }
    }
  })
}