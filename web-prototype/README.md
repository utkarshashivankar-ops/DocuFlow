# DocuFlow — Smart Document Management (Frontend)

A frontend-only implementation of DocuFlow, a document management system with a
simulated OCR + CNN document classification pipeline.

## Stack
React 18 · Vite 5 · Tailwind CSS 3 · React Router 6 · Axios · React Query 5 ·
Redux Toolkit 2 · React Hook Form + Zod · Framer Motion · Recharts · Lucide ·
React Hot Toast · date-fns · Headless UI · React Dropzone

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. Sign in with any email + a 6+ character
password — auth is mocked client-side (no backend required).

## Project structure

See `src/` — organized into `components/{ui,layout,documents,dashboard,
renewal,search,auth}`, `pages/`, `store/` (Redux slices), `services/`
(mocked API layer + mock data), `hooks/`, and `utils/`.

## Mock data & API layer

All API calls are mocked in `src/services/*Service.js` against realistic
sample data in `src/services/mockData.js` (12 documents across 5 categories).
To connect a real backend, set `VITE_API_URL` in `.env` and swap the mocked
functions for `api.get/post/delete` calls using the pre-wired Axios instance
in `src/services/api.js` (JWT auto-attached from cookies).

## Notable features

- **Processing Modal** (`src/components/documents/ProcessingModal.jsx`) —
  simulates a 4-stage OCR/CNN pipeline (preprocessing → CNN classification →
  OCR → field extraction) with live progress, then shows an extracted-data
  preview before saving.
- Dark mode (Tailwind `dark:` classes, toggled from the topbar).
- Responsive layout: hamburger sidebar on mobile, 2-col tablet, 4-col desktop grids.
- Keyboard shortcut `/` focuses the search page's input.

## Build

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to Vercel or any static host.
