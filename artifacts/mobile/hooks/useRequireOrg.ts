import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

/**
 * Tab screens assume `currentOrg` is set -- but a user can still land in
 * (tabs) with zero organizations (e.g. the "Skip for now" button on the
 * org welcome screen). Previously screens just did `if (!currentOrg)
 * return null`, producing a permanently blank screen with no way out.
 * This redirects to org setup instead.
 *
 * Returns `true` while it's safe to render the screen's real content.
 */
export function useRequireOrg(): boolean {
  const { currentOrg, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!currentOrg) {
      router.replace('/(org-setup)/welcome' as never);
    }
  }, [isLoading, currentOrg, router]);

  return !isLoading && !!currentOrg;
}
