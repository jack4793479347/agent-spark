'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { apiGet } from '@/lib/api/client';

interface OrgFromApi {
  id: string;
  name: string;
  slug?: string;
  plan: string;
  role?: string;
}

interface SessionResponse {
  user: { id: string; email: string };
  org?: OrgFromApi;
  organizations?: OrgFromApi[];
}

export function useOrgInit() {
  const user = useAuthStore((s) => s.user);
  const org = useAuthStore((s) => s.org);
  const setOrg = useAuthStore((s) => s.setOrg);
  const fetched = useRef(false);

  useEffect(() => {
    if (!user || org || fetched.current) return;
    fetched.current = true;

    apiGet<SessionResponse>('/api/auth/session')
      .then((data) => {
        // Backend returns `organizations[]` array — pick the first one
        const resolved = data.org ?? data.organizations?.[0];
        if (resolved) {
          setOrg({
            id: resolved.id,
            name: resolved.name,
            plan: resolved.plan,
            is_creator: resolved.role === 'owner' || resolved.role === 'admin',
          });
        }
      })
      .catch(() => {
        // Session endpoint may not exist yet — fail silently
      });
  }, [user, org, setOrg]);
}
