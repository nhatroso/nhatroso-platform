'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LoginSchema } from '@nhatroso/shared';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const tErrors = useTranslations('Errors');
  const tAuth = useTranslations('Auth.login');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const result = LoginSchema.safeParse(data);
    if (!result.success) {
      setError(
        tErrors(
          result.error.errors[0].message as Parameters<typeof tErrors>[0],
        ),
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.code || 'UNKNOWN_ERROR');
      }

      router.push('/dashboard');
    } catch (err) {
      const key = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      setError(tErrors(key as Parameters<typeof tErrors>[0]));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-h1 font-bold text-gray-text">NHATROSO</h1>
        </div>

        <div className="rounded-lg border border-gray-border bg-gray-card p-6 shadow-sm sm:p-8">
          <h2 className="mb-1 text-h2 font-bold text-gray-text">
            {tAuth('title')}
          </h2>
          <p className="mb-6 text-body text-gray-muted">
            {tAuth('description')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-danger-light bg-danger-light p-4 text-body text-danger">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-body font-medium text-gray-text"
              >
                {tAuth('phoneLabel')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder={tAuth('phonePlaceholder')}
                required
                className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-body font-medium text-gray-text"
              >
                {tAuth('passwordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder={tAuth('passwordPlaceholder')}
                required
                minLength={8}
                className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-5 py-2.5 text-center text-body font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light disabled:opacity-50 dark:bg-primary dark:hover:bg-primary-hover dark:focus:ring-primary-hover"
            >
              {loading ? tAuth('submitBtnLoading') : tAuth('submitBtn')}
            </button>

            <p className="text-center text-body text-gray-muted">
              {tAuth('noAccountPrompt')}{' '}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline dark:text-primary-dark"
              >
                {tAuth('registerLink')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
