'use client'

import { useEffect, useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { supabase, type Note } from '@/lib/supabase'
import Toolbar from '@/components/Toolbar'

const DEBOUNCE_MS = 600

const MOBILE_SAFE_EXTENSIONS = {
  dropcursor: false,
  gapcursor: false,
}

export default function SharedNote({ noteId }: { noteId: string }) {
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRemoteUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure(MOBILE_SAFE_EXTENSIONS),
      Placeholder.configure({ placeholder: 'Start writing…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editorProps: {
      attributes: { class: 'tiptap', spellcheck: 'true' },
    },
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
          .eq('is_shared', true)
        setSaveStatus(error ? 'error' : 'saved')
      }, DEBOUNCE_MS)
    },
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('notes').select('*').eq('id', noteId).eq('is_shared', true).single()
      if (!data) { setNotFound(true); setLoading(false); return }
      setLoading(false)
      if (editor && data.content) {
        isRemoteUpdate.current = true
        editor.commands.setContent(data.content)
        isRemoteUpdate.current = false
      }
    }
    load()
  }, [noteId, editor])

  useEffect(() => {
    const channel = supabase
      .channel(`shared-${noteId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notes', filter: `id=eq.${noteId}` }, (payload) => {
        const updated = payload.new as Note
        if (!updated.is_shared) { setNotFound(true); return }
        if (editor && updated.content !== editor.getHTML()) {
          const { from, to } = editor.state.selection
          isRemoteUpdate.current = true
          editor.commands.setContent(updated.content)
          try { editor.commands.setTextSelection({ from, to }) } catch {}
          isRemoteUpdate.current = false
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [noteId, editor])

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

  if (notFound) {
    return (
      <div className="flex flex-col h-dvh items-center justify-center gap-3 px-8 text-center" style={{ background: 'var(--bg)' }}>
        <svg className="w-14 h-14" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
        <p className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>Note not available</p>
        <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>This note is no longer shared or doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-dvh" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-14 pb-2" style={{ background: 'var(--bg)' }}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" style={{ color: 'var(--yellow)' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Shared note</span>
        </div>
        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Error' : ''}
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto px-5 py-2"
        style={{ background: 'var(--bg)' }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} className="min-h-full pb-10" />
      </div>

      <Toolbar editor={editor} />
    </div>
  )
}
