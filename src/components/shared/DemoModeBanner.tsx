'use client';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function DemoModeBanner() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  // Only render for the guest demo account
  if (!isLoaded || user?.primaryEmailAddress?.emailAddress !== 'guest@apex-demo.com') {
    return null;
  }

  async function handleSignOut() {
    await signOut();
    router.push('/sign-in');
  }

  return (
    <div
      role="banner"
      className="w-full bg-amber-500 dark:bg-amber-600 text-white text-sm font-medium px-4 py-2 flex items-center justify-between"
    >
      <span>
        🎯 <strong>Demo Mode</strong> — You are logged in as a recruiter guest. All features are available for exploration.
      </span>
      <button
        onClick={handleSignOut}
        className="ml-4 underline hover:no-underline text-white text-xs"
      >
        Sign out
      </button>
    </div>
  );
}
