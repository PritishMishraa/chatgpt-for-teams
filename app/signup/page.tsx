import SignupForm from '@/components/signup-form'
import { validateRequest } from '@/lib/auth/lucia'
import { redirect } from 'next/navigation'

export default async function SignupPage() {
  const { user } = await validateRequest()

  if (user) {
    return redirect('/')
  }

  return (
    <main className="flex flex-col p-4">
      <SignupForm />
    </main>
  )
}
