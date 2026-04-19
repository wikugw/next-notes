'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Note } from '@/lib/supabase'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined })
}

function getPreview(content: string): string {
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.slice(0, 80) || 'No additional text'
}

function getTitle(note: Note): string {
  const match = note.content.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/i)
  if (match) return match[1].replace(/<[^>]+>/g, '').trim()
  const pMatch = note.content.match(/<p[^>]*>(.*?)<\/p>/i)
  if (pMatch) {
    const text = pMatch[1].replace(/<[^>]+>/g, '').trim()
    if (text) return text
  }
  return note.title || 'New Note'
}

export default function NotesList() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from('notes')
      .select('id, title, content, is_shared, created_at, updated_at')
      .order('updated_at', { ascending: false })
    if (data) setNotes(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotes()
    const channel = supabase
      .channel('notes-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchNotes())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchNotes])

  const createNote = async () => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ title: '', content: '' })
      .select()
      .single()
    if (!error && data) router.push(`/notes/${data.id}`)
  }

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
    setSwipedId(null)
  }

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    setTouchStart(e.touches[0].clientX)
    if (swipedId && swipedId !== id) setSwipedId(null)
  }

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (diff > 60) setSwipedId(id)
    else if (diff < -20) setSwipedId(null)
    setTouchStart(null)
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2 w-2 rounded-full animate-bounce" style={{ background: 'var(--yellow)', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-dvh" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-2" style={{ background: 'var(--bg)' }}>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Notes</h1>
      </div>

      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--bg-secondary)' }}>
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <span className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>Search</span>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-16 h-16" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[15px]">No notes yet</p>
          </div>
        ) : (
          <ul>
            {notes.map((note, idx) => {
              const title = getTitle(note)
              const preview = getPreview(note.content)
              const isSwiped = swipedId === note.id

              return (
                <li
                  key={note.id}
                  className="relative overflow-hidden"
                  onTouchStart={(e) => handleTouchStart(e, note.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, note.id)}
                >
                  {/* Delete button */}
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 text-white text-sm font-medium flex items-center justify-center"
                    style={{ opacity: isSwiped ? 1 : 0 }}
                    aria-label="Delete note"
                  >
                    Delete
                  </button>

                  {/* Note row */}
                  <div
                    className="transition-transform duration-200 ease-out"
                    style={{ transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)', background: 'var(--bg)' }}
                  >
                    <button
                      onClick={() => {
                        if (isSwiped) { setSwipedId(null); return }
                        router.push(`/notes/${note.id}`)
                      }}
                      className="w-full text-left px-5 py-3 transition-colors"
                      style={{}}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className="font-semibold text-[16px] truncate flex-1" style={{ color: 'var(--text-primary)' }}>{title}</span>
                        <span className="text-[12px] flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{formatDate(note.updated_at)}</span>
                      </div>
                      <p className="text-[14px] truncate" style={{ color: 'var(--text-secondary)' }}>{preview}</p>
                    </button>
                    {idx < notes.length - 1 && (
                      <div className="h-px ml-5" style={{ background: 'var(--border)' }} />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="px-5 py-4 pb-8 flex justify-end border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <button
          onClick={createNote}
          className="flex items-center justify-center w-11 h-11 rounded-full active:opacity-70"
          aria-label="New note"
        >
          <svg className="w-7 h-7" style={{ color: 'var(--yellow)' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H5a1 1 0 110-2h6V5a1 1 0 011-1z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
