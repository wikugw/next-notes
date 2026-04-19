'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { supabase, type Note } from '@/lib/supabase'
import Toolbar from '@/components/Toolbar'

type Props = {
  noteId: string
  readOnly?: boolean
}

const DEBOUNCE_MS = 600

export default function NoteEditor({ noteId, readOnly = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [isShared, setIsShared] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRemoteUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        dropcursor: false as const,
        gapcursor: false as const,
      }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editorProps: {
      attributes: { class: 'tiptap', spellcheck: 'true' },
    },
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return
      setSaveStatus('saving')
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        const { error } = await supabase
          .from('notes')
          .update({ content: editor.getHTML() })
          .eq('id', noteId)
        setSaveStatus(error ? 'error' : 'saved')
      }, DEBOUNCE_MS)
    },
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('notes').select('*').eq('id', noteId).single()
      if (!data) { router.replace('/'); return }
      setIsShared(data.is_shared)
      setLoading(false)
      if (editor && data.content) {
        isRemoteUpdate.current = true
        editor.commands.setContent(data.content)
        isRemoteUpdate.current = false
      }
    }
    load()
  }, [noteId, editor, router])

  useEffect(() => {
    const channel = supabase
      .channel(`note-${noteId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notes', filter: `id=eq.${noteId}` }, (payload) => {
        const updated = payload.new as Note
        if (editor && updated.content !== editor.getHTML()) {
          const { from, to } = editor.state.selection
          isRemoteUpdate.current = true
          editor.commands.setContent(updated.content)
          try { editor.commands.setTextSelection({ from, to }) } catch {}
          isRemoteUpdate.current = false
        }
        setIsShared(updated.is_shared)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [noteId, editor])

  useEffect(() => {
    if (!loading && editor) setTimeout(() => editor.commands.focus('end'), 100)
  }, [loading, editor])

  const toggleShare = useCallback(async () => {
    const next = !isShared
    setIsShared(next)
    await supabase.from('notes').update({ is_shared: next }).eq('id', noteId)
    if (next) {
      const url = `${window.location.origin}/shared/${noteId}`
      await navigator.clipboard.writeText(url).catch(() => {})
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 3000)
    }
  }, [isShared, noteId])

  const handleDelete = useCallback(async () => {
    if (!confirm('Delete this note?')) return
    await supabase.from('notes').delete().eq('id', noteId)
    router.replace('/')
  }, [noteId, router])

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
      {/* Nav bar */}
      <div className="flex items-center justify-between px-3 pt-14 pb-2" style={{ background: 'var(--bg)' }}>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 active:opacity-60 py-1 px-1 -ml-1"
          style={{ color: 'var(--yellow)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[17px]">Notes</span>
        </button>

        <div className="flex items-center gap-1">
          <span className="text-[12px] mr-1" style={{ color: 'var(--text-secondary)' }}>
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Error' : ''}
          </span>

          {!readOnly && (
            <button
              onClick={toggleShare}
              className="flex items-center justify-center w-9 h-9 rounded-full active:opacity-60"
              style={{ color: isShared ? 'var(--yellow)' : 'var(--text-secondary)' }}
              aria-label={isShared ? 'Shared — tap to unshare' : 'Share note'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}

          {!readOnly && (
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-9 h-9 rounded-full active:opacity-60"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Delete note"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div
        className="flex-1 overflow-y-auto px-5 py-2"
        style={{ background: 'var(--bg)' }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} className="min-h-full pb-10" />
      </div>

      {!readOnly && <Toolbar editor={editor} />}

      {showShareToast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-full shadow-lg z-50"
          style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
        >
          Link copied to clipboard
        </div>
      )}
    </div>
  )
}
