'use client'

import type { User } from '@supabase/supabase-js'

interface AccountTabProps {
  user: User
}

export default function AccountTab({ user }: AccountTabProps) {
  return (
    <div className="p-6">
      <p className="font-mono text-sm" style={{ color: 'var(--rune-muted)' }}>
        Account settings coming soon.
      </p>
    </div>
  )
}
