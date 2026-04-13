'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import { getDefaultRedirectForRole } from '@/auth/routes'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { loginSchema } from '@/validation/auth-schema'

type LoginValues = z.infer<typeof loginSchema>

type LoginFormProps = {
  className?: string
}

export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'owner@example.com',
      password: 'changeMeOwner1!',
    },
  })

  const applyCredentials = (email: string, password: string) => {
    form.setValue('email', email)
    form.setValue('password', password)
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
    })

    if (result?.error) {
      toast.error('Invalid credentials')
      return
    }

    const session = await getSession()
    const destination = getDefaultRedirectForRole(session?.user?.role)

    toast.success('Welcome back!')
    router.replace(destination)
  })

  const isSubmitting = form.formState.isSubmitting

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-slate-50">Sign in to continue</h1>
        <p className="text-sm text-slate-400">
          Use your backend account credentials. This form now authenticates through the API and creates a NextAuth session.
        </p>
      </div>

      <FormField label="Email" error={form.formState.errors.email?.message} htmlFor="login-email">
        <Input id="login-email" autoComplete="email" {...form.register('email')} />
      </FormField>

      <FormField
        label="Password"
        error={form.formState.errors.password?.message}
        htmlFor="login-password"
      >
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...form.register('password')}
        />
      </FormField>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Quick fill:</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyCredentials('admin@example.com', 'changeMeAdmin1!')}
          >
            Admin
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyCredentials('owner@example.com', 'changeMeOwner1!')}
          >
            Organizer
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
}
