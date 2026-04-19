# Notes

A personal iOS-style notes app with real-time sync, built with Next.js + Supabase + Tiptap. PWA-ready.

## Setup

### 1. Install dependencies

```bash
npm install @supabase/supabase-js @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-task-list @tiptap/extension-task-item
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings → API**

### 3. Configure environment

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key
```

### 4. Add PWA icons

Add two PNG files to `/public`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

You can generate them from any image at [favicon.io](https://favicon.io).

### 5. Run

```bash
npm run dev
```

## Features

- **Notes list** — sorted by last updated, swipe left to delete
- **Rich editor** — bold, italic, headings, bullet lists, checklists
- **Auto-save** — debounced, no save button needed
- **Real-time sync** — changes propagate live to any open tab or device
- **Share by URL** — tap share icon to make a note public and copy its link. Your wife can open `/notes/[id]` and edit live.
- **PWA** — installable on iOS/Android, works offline for cached content

## Routes

| Route | Description |
|---|---|
| `/` | Notes list |
| `/notes/[id]` | Note editor (private) |
| `/shared/[id]` | Shared note (anyone with link can edit) |

## Sharing flow

1. Open a note
2. Tap the share icon (top right) → link is copied to clipboard
3. Send the link to your wife
4. Both of you can edit the note simultaneously — changes sync in real-time
5. Tap share icon again to make the note private (link stops working)
