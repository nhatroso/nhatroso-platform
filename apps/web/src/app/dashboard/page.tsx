'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    // In a real app, we'd call the logout API.
    // For now, we'll just clear the cookie (though HttpOnly means we should do it via API).
    // Let's assume the API route handler will handle it.
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b bg-white border-zinc-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold tracking-tight">NHATROSO</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
            <CardDescription>
              You have successfully logged in using your phone number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-600">
              This is a protected area. Only authenticated users can see this
              content.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
