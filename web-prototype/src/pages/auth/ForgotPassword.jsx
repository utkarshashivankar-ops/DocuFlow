import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { authService } from '@/services/authService'

const schema = z.object({ email: z.string().email('Enter a valid email') })

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data) {
    await authService.forgotPassword(data)
    setSent(true)
    toast.success('Reset link sent')
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-textprimary">Reset your password</h2>
      <p className="mt-1 text-sm text-textsecondary">We&apos;ll email you a link to reset it.</p>
      {sent ? (
        <div className="mt-8 rounded-btn bg-primary-50 p-4 text-sm text-primary-700">
          Check your inbox for a password reset link.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <Input label="Email" type="email" icon={Mail} placeholder="you@company.com" error={errors.email?.message} {...register('email')} />
          <Button type="submit" className="w-full" loading={isSubmitting}>Send Reset Link</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-textsecondary">
        Remembered it? <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">Back to sign in</Link>
      </p>
    </AuthLayout>
  )
}
