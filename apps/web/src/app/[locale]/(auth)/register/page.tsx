'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RegisterSchema } from '@nhatroso/shared';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const tErrors = useTranslations('Errors');
  const tAuth = useTranslations('Auth.register');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const result = RegisterSchema.safeParse(data);
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
      const response = await fetch('/api/auth/register', {
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            NHATROSO
          </h1>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
            {tAuth('title')}
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {tAuth('description')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-gray-800 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                {tAuth('nameLabel')}
              </label>
              <input
                id="name"
                name="name"
                placeholder={tAuth('namePlaceholder')}
                required
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                {tAuth('phoneLabel')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder={tAuth('phonePlaceholder')}
                required
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                {tAuth('emailLabel')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder={tAuth('emailPlaceholder')}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                {tAuth('passwordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder={tAuth('passwordPlaceholder')}
                minLength={8}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              {loading ? tAuth('submitBtnLoading') : tAuth('submitBtn')}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {tAuth('hasAccountPrompt')}{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:underline dark:text-blue-500"
              >
                {tAuth('loginLink')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
