export interface Frontmatter {
  friendly_title?: string | null
  tags?: string | null
  visible?: boolean | null
  summary?: string | null
  [k: string]: string | boolean | null | undefined
}

export function parseFrontmatter(source: string): { data: Frontmatter; content: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: source }
  const [, yaml, content] = match
  const data: Frontmatter = {}
  for (const line of yaml.split(/\r?\n/)) {
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const [, k, rawV] = m
    let v: string | boolean | null = rawV.trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (v === 'true') data[k] = true
    else if (v === 'false') data[k] = false
    else if (v === 'null' || v === '~' || v === '') data[k] = null
    else data[k] = v
  }
  return { data, content }
}

export function serializeFrontmatter(data: Frontmatter, content: string): string {
  const preferredOrder = ['friendly_title', 'tags', 'visible', 'summary']
  const keys = Array.from(new Set([...preferredOrder.filter((k) => k in data), ...Object.keys(data)]))
  const lines = keys.map((k) => fmLine(k, data[k]))
  const body = content.startsWith('\n') ? content : `\n${content}`
  return `---\n${lines.join('\n')}\n---${body}`
}

function fmLine(key: string, value: string | boolean | null | undefined): string {
  if (value === null || value === undefined) return `${key}: null`
  if (typeof value === 'boolean') return `${key}: ${value}`
  return `${key}: ${value}`
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
