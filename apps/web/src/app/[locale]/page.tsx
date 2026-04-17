import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-surface font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert mb-8"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-h1 font-semibold leading-10 tracking-tight text-gray-text">
            NHATROSO
          </h1>
          <p className="max-w-md text-h3 leading-8 text-gray-muted">
            Ứng dụng quản lý nhà trọ, căn hộ dịch vụ chuyên nghiệp.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-body font-medium sm:flex-row mt-8">
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-white transition-all hover:bg-primary-hover shadow-sm md:w-[158px]"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-gray-border bg-gray-card px-6 text-gray-text transition-all hover:bg-gray-surface md:w-[158px]"
          >
            Đăng ký
          </Link>
        </div>
      </main>
    </div>
  );
}
