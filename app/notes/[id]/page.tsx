import NoteEditor from '@/components/NoteEditor'
import { use } from 'react'

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <NoteEditor noteId={id} />
}
