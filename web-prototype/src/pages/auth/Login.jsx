import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  remember: z.boolean().optional(),
})

export default function Login() {
  const { login } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data) {
    try { await login(data) } catch { /* toast handled in hook */ }
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-textprimary">Sign in to DocuFlow</h2>
      <p className="mt-1 text-sm text-textsecondary">Welcome back — enter your details below.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Email" type="email" icon={Mail} placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" icon={Lock} placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-textsecondary">
            <input type="checkbox" className="rounded border-bordergray text-primary-600 focus:ring-primary-500" {...register('remember')} />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>Sign In</Button>
      </form>
      <p className="mt-6 text-center text-sm text-textsecondary">
        Don&apos;t have an account? <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">Sign up</Link>
      </p>
    </AuthLayout>
  )
}
