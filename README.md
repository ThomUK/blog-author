# blog-author

A static Vue 3 SPA for authoring posts in [`ThomUK/blog_posts`](https://github.com/ThomUK/blog_posts).

The app is served from GitHub Pages and authenticates to GitHub with a user-supplied fine-grained Personal Access Token. It provides:

- A private **author** view for creating and editing markdown posts under `smith_data/posts/`.
- A private **reader** view for previewing posts (including unpublished drafts).
- A draft-branch + PR workflow: saving a post commits to a branch and opens a PR against `main`. Publishing = merging the PR.

The public blog remains served by the existing Laravel Forge deployment triggered from `main` of `blog_posts`.

## Local development

```sh
npm install
npm run dev
```

Then open `http://localhost:5173/blog-author/` and paste a fine-grained PAT scoped to `ThomUK/blog_posts` with:

- Contents: Read & Write
- Pull requests: Read & Write
- Metadata: Read (auto)

## Deployment

Pushes to `main` build and deploy to GitHub Pages via `.github/workflows/deploy.yml`.
