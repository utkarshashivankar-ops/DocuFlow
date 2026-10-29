import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { useMemo } from 'react'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

function strengthOf(pw = '') {
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

export default function Register() {
  const { register: doRegister } = useAuth()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })
  const pw = watch('password', '')
  const strength = useMemo(() => strengthOf(pw), [pw])
  const bars = ['bg-danger', 'bg-warning', 'bg-info', 'bg-success']

  async function onSubmit(data) {
    try { await doRegister(data) } catch { /* toast handled in hook */ }
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-textprimary">Create your account</h2>
      <p className="mt-1 text-sm text-textsecondary">Start organizing your documents in minutes.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Full Name" icon={User} placeholder="Aarav Sharma" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Email" type="email" icon={Mail} placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
        <div>
          <Input label="Password" type="password" icon={Lock} placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          {pw && (
            <div className="mt-2 flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cn('h-1.5 flex-1 rounded-full bg-gray-200', i < strength && bars[strength - 1])} />
              ))}
            </div>
          )}
        </div>
        <Input label="Confirm Password" type="password" icon={Lock} placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <label className="flex items-start gap-2 text-sm text-textsecondary">
          <input type="checkbox" className="mt-0.5 rounded border-bordergray text-primary-600 focus:ring-primary-500" {...register('terms')} />
          I agree to the Terms of Service and Privacy Policy
        </label>
        {errors.terms && <p className="text-xs text-danger">{errors.terms.message}</p>}
        <Button type="submit" className="w-full" loading={isSubmitting}>Create Account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-textsecondary">
        Already have an account? <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
