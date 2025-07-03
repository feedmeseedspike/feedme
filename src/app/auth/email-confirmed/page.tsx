import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EmailConfirmedPage({
  searchParams
}: {
  searchParams: { callbackUrl?: string }
}) {
  const callbackUrl = searchParams.callbackUrl || '/account';
  
  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow text-center">
      <h1 className="text-2xl font-bold mb-4 text-green-600">Email Confirmed!</h1>
      <p className="mb-6">Your email has been successfully confirmed. You can now access your account.</p>
      <Button asChild className="w-full">
        <Link href={callbackUrl}>Continue to Account</Link>
      </Button>
    </div>
  );
}