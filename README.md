# blog-author

A static, single-user blog authoring SPA that you can host on GitHub Pages and point at any GitHub repo that stores markdown posts in a directory. No backend.

## What it does

- Lists, reads, and edits markdown posts in a repo + directory of your choice.
- Saves via a **draft branch + PR** workflow: committing a post creates a branch and opens a PR against your base branch. Publishing = merging that PR.
- Mobile-first tabbed editor (Write / Preview / Meta) with CodeMirror 6.
- Preserves YAML frontmatter on round-trip (`friendly_title`, `tags`, `visible`, `summary`, plus any extra keys).
- Authenticates with a user-supplied fine-grained Personal Access Token, stored in this browser's localStorage.

## Use it

1. Fork this repo.
2. If your fork uses a different name, update `base` in `vite.config.ts` to `'/<your-repo-name>/'`.
3. In repo **Settings → Pages**, set Source = "GitHub Actions".
4. Push to `main` — `.github/workflows/deploy.yml` builds and publishes to GitHub Pages.
5. Visit `https://<you>.github.io/<your-repo-name>/`. You will land on **Settings** the first time. Enter:
   - **Owner** — user or org that owns the posts repo
   - **Repo** — the posts repo name
   - **Posts directory** — path to the posts folder (e.g. `content/posts`)
   - **Base branch** — usually `main`
   - **PAT** — a fine-grained token scoped to the posts repo, with **Contents: Read & Write** and **Pull requests: Read & Write**

## Post format

Posts are markdown files with optional YAML frontmatter. Filenames follow `YYYY-MM-DD.<slug>.md`. Example:

```markdown
---
friendly_title: My first post
tags: General
visible: true
---

Hello world.
```

Slugs are derived from the title.

## Local development

```sh
npm install
npm run dev
```

## Security

The PAT lives in your browser's localStorage. Anyone who can see the device can read it. Use a fine-grained token scoped narrowly to the target repo, and revoke it when you're done. The app surfaces a warning on the Settings screen.
