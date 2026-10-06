import type { PageInfo } from '@researchflow/shared';

const text = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
const meta = (...names: string[]) => { for (const name of names) { const value = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.getAttribute('content'); if (value) return text(value); } return ''; };
function readableContent() {
  const clone = document.body?.cloneNode(true) as HTMLElement | null;
  if (!clone) return '';
  clone.querySelectorAll('script, style, noscript, template, nav, footer, header, aside, form, dialog, [aria-hidden="true"]').forEach((node) => node.remove());
  const candidates = Array.from(clone.querySelectorAll('article, main, [role="main"], .article, .post, .entry-content, .article-body, .post-content, .content')) as HTMLElement[];
  const scored = candidates.map((node) => ({ node, score: (node.innerText?.length ?? 0) + node.querySelectorAll('p').length * 250 })).sort((a, b) => b.score - a.score);
  const value = text((scored[0]?.node ?? clone).innerText);
  return value.slice(0, 200_000);
}
export function getPageInfo(): PageInfo {
  const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"], link[rel="shortcut icon"]');
  const selectedText = text(window.getSelection()?.toString());
  const content = readableContent() || text(document.body?.innerText).slice(0, 200_000);
  return { url: window.location.href, title: text(document.title) || window.location.hostname, domain: window.location.hostname, description: meta('description', 'og:description'), author: meta('author', 'article:author'), publishedAt: meta('article:published_time', 'datePublished', 'date'), faviconUrl: link?.href || `${window.location.origin}/favicon.ico`, content, selectedText, capturedAt: new Date().toISOString() };
}
