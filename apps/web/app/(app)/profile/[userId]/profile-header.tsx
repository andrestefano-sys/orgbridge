'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProfileEditModal } from './profile-edit'

interface Props {
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    jobTitle: string | null
    bio: string | null
  }
  role: string
  roleLabel: string
  roleColors: { bg: string; text: string; border: string }
  orgNodeName: string | null
  orgNodeColor: string | null
  joinedDate: string | null
  isOwnProfile: boolean
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

export function ProfileHeader({ user, role, roleLabel, roleColors, orgNodeName, orgNodeColor, joinedDate, isOwnProfile }: Props) {
  const [name, setName] = useState(user.name)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const [jobTitle, setJobTitle] = useState(user.jobTitle)
  const [bio, setBio] = useState(user.bio)

  function handleSaved(newName: string, newAvatarUrl: string | null, newJobTitle: string | null, newBio: string | null) {
    setName(newName)
    setAvatarUrl(newAvatarUrl)
    setJobTitle(newJobTitle)
    setBio(newBio)
  }

  return (
    <div
      className="rounded-2xl p-6 mb-5"
      style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
    >
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              width={64}
              height={64}
              className="rounded-2xl object-cover"
              style={{ width: 64, height: 64 }}
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold select-none"
              style={{
                background: 'var(--ob-navy)',
                color: 'var(--ob-amber)',
                fontFamily: 'var(--font-sora)',
              }}
            >
              {initials(name)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-xl font-semibold tracking-tight"
                style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
              >
                {name}
              </h1>
              {isOwnProfile && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--ob-surface-alt)', color: 'var(--ob-text-faint)', border: '1px solid var(--ob-border)' }}
                >
                  você
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isOwnProfile && (
                <Link
                  href={`/messages?with=${user.id}`}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                  style={{
                    background: 'var(--ob-surface-alt)',
                    border: '1.5px solid var(--ob-border)',
                    color: 'var(--ob-text-muted)',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Mensagem
                </Link>
              )}
              {isOwnProfile && (
                <ProfileEditModal
                  currentName={name}
                  currentAvatarUrl={avatarUrl}
                  currentJobTitle={jobTitle}
                  currentBio={bio}
                  onSaved={handleSaved}
                />
              )}
            </div>
          </div>

          {/* Job title */}
          {jobTitle && (
            <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--ob-text-muted)' }}>
              {jobTitle}
            </p>
          )}

          <p className="text-sm mb-3" style={{ color: jobTitle ? 'var(--ob-text-faint)' : 'var(--ob-text-muted)' }}>
            {user.email}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: roleColors.bg, color: roleColors.text, border: `1px solid ${roleColors.border}` }}
            >
              {roleLabel}
            </span>

            {orgNodeName && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  background: orgNodeColor ? `${orgNodeColor}18` : 'var(--ob-surface-alt)',
                  color: orgNodeColor ?? 'var(--ob-text-muted)',
                  border: `1px solid ${orgNodeColor ? `${orgNodeColor}40` : 'var(--ob-border)'}`,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                {orgNodeName}
              </span>
            )}

            {joinedDate && (
              <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                Entrou em {joinedDate}
              </span>
            )}
          </div>

          {/* Bio */}
          {bio && (
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: 'var(--ob-text-muted)' }}
            >
              {bio}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
