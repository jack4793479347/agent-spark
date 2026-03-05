'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import { AuthModal } from '@/components/shared/AuthModal';

interface AuthWallProps {
  children: (opts: { onClick: () => void }) => React.ReactNode;
  onAuthenticated: () => void;
}

/**
 * AuthWall — wraps interactive elements that require authentication.
 * If user is signed in, executes the action directly.
 * If not, shows the AuthModal first.
 *
 * Usage:
 *   <AuthWall onAuthenticated={() => rentAgent(id)}>
 *     {({ onClick }) => <button onClick={onClick}>Rent Agent</button>}
 *   </AuthWall>
 */
export function AuthWall({ children, onAuthenticated }: AuthWallProps) {
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleClick = useCallback(() => {
    if (loading) return;

    if (user) {
      onAuthenticated();
    } else {
      setShowModal(true);
    }
  }, [user, loading, onAuthenticated]);

  return (
    <>
      {children({ onClick: handleClick })}
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          onAuthenticated();
        }}
      />
    </>
  );
}
