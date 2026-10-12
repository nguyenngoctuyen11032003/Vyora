# Vyora

A mobile-first weekly training plan viewer for gym beginners, built with Next.js.

## Overview

Vyora (formerly gym-for-beginners) is a static frontend that presents a beginner workout schedule for the week. It is designed to be used on a phone inside the gym: open the page, see today's session, scan sets and reps, and open an exercise's instructions or video in two or three taps.

All workout data is stored locally in the codebase (`src/data/workout-plan.ts`). There is no backend, database, or user account. The interface is in Vietnamese.

## Key features

- **Today first**: the current weekday is detected from the device's local date, and that day's session is selected on load.
- **Weekly day selector**: switch between Monday and Sunday. Saturday and Sunday are rest days.
- **Exercise list per day**: each exercise shows its name, Vietnamese name, target muscle groups, sets, reps, and notes.
- **Exercise detail view**: opens as a dialog on desktop (768 px and wider) and as a bottom drawer on mobile, with description, step-by-step instructions, and a video.
- **Embedded YouTube videos**: supports 16:9 and 9:16 (Shorts) aspect ratios. Only HTTPS embed URLs from `youtube.com` or `youtube-nocookie.com` are accepted; otherwise an empty "no video yet" state is shown.
- **Rest day card**: recovery guidance and a shortcut to the next training day.
- **Accessibility**: keyboard support, visible focus, focus trapping and Escape in overlays, labelled iframes, and large touch targets.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) with React 19 and TypeScript
- [Tailwind CSS](https://tailwindcss.com) 4 (via `@tailwindcss/postcss`)
- [Radix UI](https://www.radix-ui.com) Dialog and Slot, [Vaul](https://vaul.emilkowal.ski) drawer
- `class-variance-authority`, `clsx`, `tailwind-merge` for component styling
- [Lucide](https://lucide.dev) icons
- Geist fonts via `next/font`
- [Vitest](https://vitest.dev) with jsdom and Testing Library for tests
- ESLint 9 with `eslint-config-next`

## Project structure

```
app/                  Root layout, global styles, and the home page
src/
  components/
    layout/           App header and footer
    shared/           Page container, muscle badge, empty video state
    ui/               Base UI primitives (button, badge, dialog, drawer, skeleton)
    workout/          Day selector, exercise grid/card, detail dialog, video, rest day card
  data/               Weekly workout plan data
  hooks/              useMediaQuery
  lib/                Day and video URL helpers, class name utility
  types/              Workout and exercise types
public/image/         App logo
docs/                 Design spec and implementation plan
```

## Getting started

### Prerequisites

- Node.js (a version supported by Next.js 16)
- npm

### Installation

```bash
git clone https://github.com/nguyenngoctuyen11032003/Vyora.git
cd Vyora
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment variables

None. The app does not read any environment variables.

## Scripts

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the development server         |
| `npm run build` | Create a production build            |
| `npm run start` | Run the production build             |
| `npm run lint`  | Run ESLint                           |
| `npm test`      | Run the test suite once with Vitest  |

## Notes

- To change the plan or replace a video, edit `src/data/workout-plan.ts`. Set a video's `embedUrl` to `null` to show the empty video state.
- Tests live next to the code they cover (`*.test.ts` / `*.test.tsx`).
- The design context is described in `PRODUCT.md`, and the original spec and plan are in `docs/superpowers/`.

## Author

Nguyễn Ngọc Tuyền ([@nguyenngoctuyen11032003](https://github.com/nguyenngoctuyen11032003))
