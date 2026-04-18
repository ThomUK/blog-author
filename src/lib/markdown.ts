import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({ html: true, linkify: true, breaks: false, typographer: true })

export function renderMarkdown(src: string): string {
  return DOMPurify.sanitize(md.render(src), {
    ADD_ATTR: ['target', 'rel']
  })
}
