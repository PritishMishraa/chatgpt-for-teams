import InvitationForm from '@/components/invitation-form'
import { getUserAuth } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { env } from '@/env.mjs'

export default async function InvitationPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { session } = await getUserAuth()

  if (session) {
    redirect('/')
  }
  
  const { token } = searchParams
  
  if (!token || typeof token !== 'string') {
    return (
      <main className="flex flex-col p-4">
        <p className="text-center text-lg">
          Invalid invitation link
        </p>
      </main>
    )
  }
  
  const decoded = jwt.verify(token, env.JWT_SECRET) as {
    email: string
    teamId: number
  }
  
  if (!decoded.email || !decoded.teamId) {
    return (
      <main className="flex flex-col p-4">
        <p className="text-center text-lg">
          Invalid invitation link
        </p>
      </main>
    )
  }

  return (
    <main className="flex flex-col p-4">
      <InvitationForm email={decoded.email} teamId={decoded.teamId} />
    </main>
  )
}