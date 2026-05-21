'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email:    z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { loginAsync, isLoggingIn } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    try {
      await loginAsync(data)
      toast.success('Login berhasil')
    } catch {
      toast.error('Email atau password salah')
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f9f9ff 0%, #e8edff 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* ── Logo area ── */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#0052CC] shadow-lg">
            <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 32 }}>
              medical_services
            </span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#091E42]">OMARA EMR</h1>
          <p className="mt-1 text-[14px] text-[#434654]">Sistem Rekam Medis Elektronik</p>
        </div>

        {/* ── Card ── */}
        <div className="rounded-xl border border-[#c3c6d6] bg-white p-7 shadow-card">
          <p className="mb-5 text-[16px] font-semibold text-[#091E42]">Masuk ke akun Anda</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-[#041b3c]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@klinik.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-[12px] text-[#FF5630]">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-[#041b3c]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-[12px] text-[#FF5630]">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded bg-[#0052CC] text-[14px] font-semibold text-white transition-colors hover:bg-[#003d9b] disabled:opacity-60"
            >
              {isLoggingIn && (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  autorenew
                </span>
              )}
              {isLoggingIn ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[12px] text-[#737685]">
          &copy; {new Date().getFullYear()} OMARA EMR. Hak cipta dilindungi.
        </p>
      </div>
    </main>
  )
}
