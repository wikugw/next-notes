'use client'

import { type Editor } from '@tiptap/react'

type Props = {
  editor: Editor | null
}

type ToolbarButton = {
  label: string
  icon: React.ReactNode
  action: () => void
  active?: boolean
}

export default function Toolbar({ editor }: Props) {
  if (!editor) return null

  const buttons: ToolbarButton[] = [
    {
      label: 'Bold',
      icon: <span className="font-bold text-sm">B</span>,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      label: 'Italic',
      icon: <span className="italic text-sm">I</span>,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
    {
      label: 'Heading',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      ),
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive('heading', { level: 1 }),
    },
    {
      label: 'Bullet list',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
    },
    {
      label: 'Checklist',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => editor.chain().focus().toggleTaskList().run(),
      active: editor.isActive('taskList'),
    },
  ]

  return (
    <div
      className="flex items-center gap-1 px-4 py-2 border-t"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onMouseDown={(e) => {
            e.preventDefault()
            btn.action()
          }}
          aria-label={btn.label}
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
          style={{
            background: btn.active ? 'var(--bg-tertiary)' : 'transparent',
            color: btn.active ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {btn.icon}
        </button>
      ))}

      <div className="w-px h-6 mx-1" style={{ background: 'var(--border)' }} />

      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().undo().run() }}
        aria-label="Undo"
        className="flex items-center justify-center w-10 h-10 rounded-lg disabled:opacity-30"
        style={{ color: 'var(--text-secondary)' }}
        disabled={!editor.can().undo()}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().redo().run() }}
        aria-label="Redo"
        className="flex items-center justify-center w-10 h-10 rounded-lg disabled:opacity-30"
        style={{ color: 'var(--text-secondary)' }}
        disabled={!editor.can().redo()}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      </button>
    </div>
  )
}
