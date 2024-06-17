import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { getCreditsForTeam, getMissingKeys } from '@/app/actions'
import { getUserAuth } from '@/lib/auth/utils'
import Link from 'next/link'
import { validateRequest } from '@/lib/auth/lucia'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Next.js AI Chatbot'
}

export default async function IndexPage() {
  const id = nanoid()
  const { session } = await getUserAuth()
  const missingKeys = await getMissingKeys()
  const { user } = await validateRequest()

  if (!user) {
    return redirect('/login')
  }
  const credits = await getCreditsForTeam(user.currentTeamId || -1)

  if (session == null) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 pt-16">
        <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
          <h1 className="text-lg font-semibold">Welcome to ChatGPT Clone!</h1>
          <p className="leading-normal text-muted-foreground">
            <ul>
              <li>
                <Link className="text-blue-500" href="/login">
                  Login
                </Link>{' '}
                to start chatting with the AI.
              </li>
              <li>
                <Link className="text-blue-500" href="/signup">
                  Register
                </Link>{' '}
                for a new account.
              </li>
            </ul>
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {credits > 0 ? (
        <AI initialAIState={{ chatId: id, messages: [] }}>
          <Chat id={id} session={session} missingKeys={missingKeys} />
        </AI>
      ) : (
        <div className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
          <div className="mx-auto max-w-2xl w-full px-4 pt-16">
            <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
              <h1 className="text-lg font-semibold">
                Welcome to ChatGPT Clone!
              </h1>
              <p className="leading-normal text-muted-foreground">
                You have run out of credits. New credits will be added in 24 hours. 
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
