import { LoginForm } from '@/features/auth';
import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';


export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    redirect('/business-owner/dashboard' as Route)
  }

  return (
    <div className="space-y-6">
      <LoginForm />
      <p className="text-center text-xs text-slate-400">
        Need an account?{' '}
        <Link className="text-sky-300 hover:text-sky-200" href="/register">
          Register now
        </Link>
      </p>
    </div>
  )
}