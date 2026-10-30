# KeyRush

KeyRush is a premium, browser-based typing game. It is calm, focused and fast: a dark, minimal interface where the
typing experience comes first. Practise with timed tests, relax in Zen mode, type real code with syntax highlighting,
chase high scores in the arcade-style Rush mode, or work through curated quotations. Everything runs in the browser,
with no backend and no account. Your statistics and preferences are stored locally.

## Features

### Game modes

| Mode | What it is |
| --- | --- |
| **Classic** | Timed tests of 15, 30, 60 or 120 seconds with word sequences or full passages. The timer starts with the first keystroke. |
| **Zen** | No timer and no pressure. Pick a text length (short, medium, long, random or endless) and finish whenever you like. |
| **Code** | 61 snippets in JavaScript, TypeScript, Python, HTML, CSS and SQL with syntax highlighting, line breaks and automatic indentation. |
| **Rush** | Arcade mode. Words fall down the screen and get faster level by level. Clear them before they land, keep your combo, protect your lives. Three difficulties with separate high scores. |
| **Quote** | Longer quotations by category (Motivation, Philosophy, Science, Technology, Literature, Everyday Life). Sources are shown for every quotation with a verified origin. |
| **Daily Challenge** | One passage per day, the same for everyone, picked from the date. Tracks your daily record, accuracy, completion and streak. |

### Typing engine

- Character-by-character validation with correct, incorrect and current character highlighting
- Smooth caret (line, block or underline) and automatic scrolling for long texts
- Backspace and Ctrl/Alt + Backspace (delete word) support
- Correct handling of spaces, punctuation, brackets, operators, line breaks and indentation
- Reads text input events instead of raw key codes, which keeps international layouts and on-screen keyboards working
- Text selection, pasting and dropping are blocked in the typing area

### Metrics

All modes use the same formulas, so results are comparable and never inflated:

- **WPM** = (correct characters / 5) / minutes
- **Raw WPM** = (all typed characters / 5) / minutes
- **Accuracy** = correct keystrokes / all keystrokes (corrected mistakes still count as mistakes)
- **CPM** = correct characters / minutes

Characters inserted automatically (code indentation) are never counted as typed.

### Results, statistics and progress

- Detailed results screen with WPM, raw WPM, accuracy, CPM, correct and incorrect characters, errors and duration
- Per-second performance chart with error markers
- Comparison with your personal best, plus a subtle celebration for new records
- Statistics page with totals, averages, speed and accuracy charts, a daily activity heatmap, personal records per mode and test history
- Everything is saved in LocalStorage and survives page reloads; statistics can be reset at any time

### Settings

Dark and light theme (dark by default), sound effects with volume, caret style, smooth caret, font size, typing font,
default game mode, default test duration, live statistics on or off, and reduced motion.

### Content library

The built-in library is modular and lives in `src/content`:

- **117 passages** across nine categories (Everyday Life, Technology, Nature, Science, Travel, Business, History, Creativity, Random), each tagged with a difficulty and classified as short, medium or long
- **61 code snippets** across six languages
- **61 quotations and passages**: public-domain quotations with documented sources, plus original passages that are clearly labelled as such
- Word pools for word-sequence tests and the Rush mode tiers

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Tab` + `Enter` | Restart with a new text |
| `Esc` | Exit the current test |
| `Shift` + `Enter` | Finish a Zen session |
| `Ctrl` + `,` (`Cmd` + `,` on macOS) | Open settings |
| `Alt` + `1` to `5` | Classic, Zen, Code, Rush, Quote |
| `?` | Show the shortcut help |

Mode shortcuts are ignored while a test is running, so `Alt` combinations used to type special characters keep
working.

## Tech stack

- [React](https://react.dev) 19 and [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) 7
- [Tailwind CSS](https://tailwindcss.com) 4
- [Framer Motion](https://motion.dev) for animations
- [Lucide](https://lucide.dev) icons
- [Fontsource](https://fontsource.org) for self-hosted fonts (Inter and five monospace fonts)
- React Router with `HashRouter` so routing works on static hosting

Charts, syntax highlighting and sound effects are implemented without extra libraries.

## Local development

Requirements: Node.js 20.19 or newer (22 recommended) and npm.

```bash
npm install
```

```bash
npm run dev
```

Vite prints a local URL (usually http://localhost:5173). Changes reload instantly.

Type checking without building:

```bash
npm run typecheck
```

## Build

```bash
npm run build
```

The production build is written to `dist/`. Preview it locally with:

```bash
npm run preview
```

## Deploying to GitHub Pages

The repository contains a workflow at `.github/workflows/deploy.yml` that builds and deploys the site automatically.

1. Push the repository to GitHub.
2. Open **Settings > Pages** in the repository and set **Source** to **GitHub Actions**.
3. Push to the `main` branch, or run the workflow manually from the **Actions** tab.
4. After the run finishes, the site is available at `https://<user>.github.io/<repository>/`.

If your default branch is not `main`, change the branch name in the workflow's `on.push.branches` setting.

### Base path

KeyRush uses hash-based routing and a relative base path (`./`) by default, so the same build works on a project site
(`/<repository>/`), a user site or a custom domain without any changes. All asset paths are relative.

To build for a fixed base path instead, set `BASE_PATH`:

```bash
BASE_PATH=/KeyRush/ npm run build
```

## Project structure

```
src/
  components/
    charts/     SVG line chart and activity heatmap
    layout/     Navbar, footer, shortcut dialog, error boundary
    results/    Results screen and record celebration
    rush/       Rush arcade mode
    typing/     Typing renderer, live statistics, test controller
    ui/         Buttons, segmented controls, selects, switches, dialogs
  content/      Text library (passages, code, quotes, words) and selection logic
  engine/       Typing session, metrics, result building, syntax highlighter
  hooks/        Small reusable hooks
  lib/          Storage, dates, formatting, randomness, sound, keyboard helpers
  pages/        Typing test, Daily Challenge, Statistics, Settings
  store/        React contexts for settings, statistics, toasts and app state
```

### Adding content

- **Passages:** add an entry `['easy' | 'medium' | 'hard', 'Your text']` to a file in `src/content/passages/`. Lengths are classified automatically.
- **Code snippets:** add `{ title, code }` to a file in `src/content/code/`. Use spaces for indentation and avoid trailing whitespace.
- **Quotes:** add `{ text, author?, source? }` to `src/content/quotes.ts`. Only set `author` for quotations with a verified source; entries without an author are shown as original passages.

Use characters that exist on a standard keyboard (straight quotes, plain hyphens) so every text can be typed.

## Data and privacy

KeyRush has no backend. Statistics and settings are stored in your browser's LocalStorage under keys starting with
`keyrush:`. Nothing is sent anywhere. Clearing site data or using **Reset statistics** removes your history.
