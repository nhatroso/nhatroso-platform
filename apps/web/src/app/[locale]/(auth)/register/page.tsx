'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RegisterSchema } from '@nhatroso/shared';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tAuth = useTranslations('auth.register');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Validate with Zod
    const result = RegisterSchema.safeParse(data);
    if (!result.success) {
      // Zod validation returns the translation key
      setError(tErrors(result.error.errors[0].message as any));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Backend now returns error.code
        throw new Error(errorData?.error?.code || 'UNKNOWN_ERROR');
      }

      router.push('/dashboard');
    } catch (err) {
      const key = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      setError(tErrors(key as any));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-zinc-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {tAuth('title')}
          </CardTitle>
          <CardDescription>{tAuth('description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 border border-red-100">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{tAuth('nameLabel')}</Label>
              <Input
                id="name"
                name="name"
                placeholder={tAuth('namePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{tAuth('phoneLabel')}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder={tAuth('phonePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{tAuth('emailLabel')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={tAuth('emailPlaceholder')}
              />
            </div>
            <Label htmlFor="password">{tAuth('passwordLabel')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder={tAuth('passwordPlaceholder')}
              minLength={8}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tAuth('submitBtnLoading') : tAuth('submitBtn')}
            </Button>
            <p className="text-sm text-center text-zinc-500">
              {tAuth('hasAccountPrompt')}{' '}
              <Link
                href="/login"
                className="text-black font-semibold hover:underline"
              >
                {tAuth('loginLink')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
