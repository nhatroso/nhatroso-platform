'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from '@/services/api/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const tErrors = useTranslations('Errors');
  const tAuth = useTranslations('Auth.forgotPassword');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [email, setEmail] = React.useState('');
  const [resetToken, setResetToken] = React.useState('');
  const [resendTimer, setResendTimer] = React.useState(0);

  React.useEffect(() => {
    if (resendTimer > 0) {
      const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(id);
    }
  }, [resendTimer]);

  const [otpArray, setOtpArray] = React.useState(['', '', '', '', '', '']);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpArray(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = [...otpArray];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpArray(newOtp);
    const focusIndex =
      Math.min(pastedData.length, 5) === 6 ? 5 : Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get('email') as string;

    if (!emailValue) {
      setError(tErrors('AUTH_EMAIL_EMPTY'));
      setLoading(false);
      return;
    }

    try {
      await requestForgotPasswordOtp(emailValue);

      setEmail(emailValue);
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UNKNOWN_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setError(null);
    setLoading(true);

    try {
      await requestForgotPasswordOtp(email);
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UNKNOWN_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const currentOtp = otpArray.join('');
    if (currentOtp.length !== 6) {
      setError(tAuth('otpError') || 'Invalid OTP');
      return;
    }

    setLoading(true);
    try {
      const token = await verifyForgotPasswordOtp(email, currentOtp);
      setResetToken(token);
      setStep(3);
    } catch (err) {
      const key = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      setError(tErrors(key as Parameters<typeof tErrors>[0]));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;

    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      router.push('/login');
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
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="mb-6 inline-flex items-center gap-2 text-body font-medium text-gray-muted hover:text-primary transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {tAuth('back') || 'Quay lại'}
            </button>
          )}

          <h2 className="mb-1 text-h2 font-bold text-gray-text">
            {step === 1
              ? tAuth('title')
              : step === 2
                ? tAuth('otpLabel')
                : tAuth('newPasswordLabel')}
          </h2>
          <p className="mb-6 text-body text-gray-muted">
            {step === 1
              ? tAuth('description')
              : step === 2
                ? tAuth('otpPlaceholder')
                : tAuth('newPasswordPlaceholder')}
            {step === 2 && (
              <span className="block mt-1 font-semibold text-gray-text">
                {email}
              </span>
            )}
          </p>

          {step === 1 ? (
            <form
              key="step-1"
              onSubmit={handleRequestOtp}
              className="space-y-5"
            >
              {error && (
                <div className="rounded-lg border border-danger-light bg-danger-light p-4 text-body text-danger">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-body font-medium text-gray-text"
                >
                  {tAuth('emailLabel')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={tAuth('emailPlaceholder')}
                  required
                  className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-5 py-2.5 text-center text-body font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light disabled:opacity-50"
              >
                {loading ? tAuth('requestBtnLoading') : tAuth('requestBtn')}
              </button>

              <p className="text-center text-body text-gray-muted">
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline dark:text-primary-dark"
                >
                  {tAuth('backToLogin')}
                </Link>
              </p>
            </form>
          ) : step === 2 ? (
            <form key="step-2" onSubmit={handleVerifyOtp} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-danger-light bg-danger-light p-4 text-body text-danger">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-body font-medium text-gray-text"
                >
                  {tAuth('otpLabel')}
                </label>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otpArray.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg border border-gray-border bg-gray-input text-center text-2xl font-bold text-gray-text shadow-sm focus:border-primary focus:ring-primary"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpArray.join('').length !== 6}
                className="w-full rounded-lg bg-primary px-5 py-2.5 text-center text-body font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/50 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {tAuth('loading')}
                  </span>
                ) : (
                  'Next'
                )}
              </button>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className="text-body font-medium text-primary hover:underline disabled:text-gray-muted disabled:no-underline"
                >
                  {resendTimer > 0
                    ? `${tAuth('resendIn') || 'Gửi lại sau'} ${resendTimer}s`
                    : tAuth('resendBtn') || 'Gửi lại OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form
              key="step-3"
              onSubmit={handleResetPassword}
              className="space-y-5"
            >
              {error && (
                <div className="rounded-lg border border-danger-light bg-danger-light p-4 text-body text-danger">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-body font-medium text-gray-text"
                >
                  {tAuth('newPasswordLabel')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={tAuth('newPasswordPlaceholder')}
                  required
                  minLength={8}
                  className="block w-full rounded-lg border border-gray-border bg-gray-input p-2.5 text-body text-gray-text focus:border-primary focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-5 py-2.5 text-center text-body font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary-light disabled:opacity-50"
              >
                {loading ? tAuth('resetBtnLoading') : tAuth('resetBtn')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
