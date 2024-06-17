import LoginForm from '@/components/login-form'
import { getUserAuth } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const { session } = await getUserAuth()

  if (session) {
    redirect('/')
  }

  return (
    <main className="flex flex-col p-4">
      <LoginForm />
    </main>
  )
}
