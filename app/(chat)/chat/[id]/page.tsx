import { notFound, redirect } from 'next/navigation'

import { AI } from '@/lib/chat/actions'
import { Chat } from '@/components/chat'
import { getUserAuth } from '@/lib/auth/utils'
import { getChat, getMissingKeys } from '@/app/actions'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { session } = await getUserAuth()
  const missingKeys = await getMissingKeys()

  if (!session?.user) {
    redirect(`/login?next=/chat/${params.id}`)
  }

  const userId = session.user.id as string
  const chat = await getChat(params.id, userId)

  if (!chat) {
    redirect('/')
  }

  return (
    <AI initialAIState={{ chatId: chat.id, messages: chat.messages }}>
      <Chat
        id={chat.id}
        session={session}
        initialMessages={chat.messages}
        missingKeys={missingKeys}
      />
    </AI>
  )
}
