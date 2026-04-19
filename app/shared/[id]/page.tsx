import SharedNote from '@/components/SharedNote'
import { use } from 'react'

export default function SharedNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <SharedNote noteId={id} />
}
