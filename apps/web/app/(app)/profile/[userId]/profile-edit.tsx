'use client'

import { useState } from 'react'

interface Props {
  currentName: string
  currentAvatarUrl: string | null
  currentJobTitle: string | null
  currentBio: string | null
  onSaved: (name: string, avatarUrl: string | null, jobTitle: string | null, bio: string | null) => void
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function ProfileEditModal({ currentName, currentAvatarUrl, currentJobTitle, currentBio, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ?? '')
  const [jobTitle, setJobTitle] = useState(currentJobTitle ?? '')
  const [bio, setBio] = useState(currentBio ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleOpen() {
    setName(currentName)
    setAvatarUrl(currentAvatarUrl ?? '')
    setJobTitle(currentJobTitle ?? '')
    setBio(currentBio ?? '')
    setError('')
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim().length < 2) {
      setError('Nome deve ter ao menos 2 caracteres.')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || null,
        jobTitle: jobTitle.trim() || null,
        bio: bio.trim() || null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao salvar.')
      return
    }

    onSaved(data.user.name, data.user.avatarUrl, data.user.jobTitle ?? null, data.user.bio ?? null)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
        style={{
          background: 'var(--ob-surface-alt)',
          border: '1px solid var(--ob-border)',
          color: 'var(--ob-text-muted)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Editar perfil
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-fade-in"
            style={{
              background: 'var(--ob-surface)',
              border: '1px solid var(--ob-border)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="font-semibold text-base"
                style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
              >
                Editar perfil
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
                style={{ color: 'var(--ob-text-faint)' }}
                aria-label="Fechar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--ob-text-muted)' }}
                  htmlFor="profile-name"
                >
                  Nome *
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="ob-input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--ob-text-muted)' }}
                  htmlFor="profile-jobtitle"
                >
                  Cargo
                  <span className="ml-1 font-normal" style={{ color: 'var(--ob-text-faint)' }}>(opcional)</span>
                </label>
                <input
                  id="profile-jobtitle"
                  type="text"
                  className="ob-input w-full"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="ex: Engenheiro de Software"
                  maxLength={100}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--ob-text-muted)' }}
                  htmlFor="profile-bio"
                >
                  Bio
                  <span className="ml-1 font-normal" style={{ color: 'var(--ob-text-faint)' }}>(opcional)</span>
                </label>
                <textarea
                  id="profile-bio"
                  className="ob-input w-full resize-none"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  maxLength={300}
                />
                <p className="mt-1 text-right text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                  {bio.length}/300
                </p>
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--ob-text-muted)' }}
                  htmlFor="profile-avatar"
                >
                  URL do avatar
                  <span className="ml-1 font-normal" style={{ color: 'var(--ob-text-faint)' }}>(opcional)</span>
                </label>
                <input
                  id="profile-avatar"
                  type="url"
                  className="ob-input w-full"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  maxLength={500}
                />
                {avatarUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={avatarUrl}
                      alt="Preview"
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                      style={{ width: 32, height: 32 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>preview</span>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs" style={{ color: 'var(--ob-error)' }} role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all hover:opacity-80"
                  style={{ border: '1px solid var(--ob-border)', color: 'var(--ob-text-muted)' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--ob-navy)', color: '#fff' }}
                >
                  {saving && <Spinner />}
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
