export function todayIso(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function buildFilename(date: string, slug: string): string {
  return `${date}.${slug}.md`
}

export function parseFilename(name: string): { date: string; slug: string } | null {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})\.(.+)\.md$/)
  if (!m) return null
  return { date: m[1], slug: m[2] }
}

export function buildBranchName(prefix: 'post' | 'edit', date: string, slug: string): string {
  return `${prefix}/${date}-${slug}`
}
