import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SidebarNavigation } from '../app/components/sidebar';
import { sidebarNavigation } from '../app/components/sidebar-navigation';

describe('dashboard sidebar navigation', () => {
  it('provides a real destination for every sidebar item', () => {
    expect(sidebarNavigation.map(({ label }) => label)).toEqual([
      'Dashboard', 'My Research', 'Sources', 'Collections', 'Search', 'AI Chat', 'Reports', 'Settings',
    ]);
    expect(sidebarNavigation.every(({ href }) => typeof href === 'string' && href.length > 0)).toBe(true);
  });

  it('renders every destination as a real anchor link', () => {
    const markup = renderToStaticMarkup(createElement(SidebarNavigation));
    for (const { label, href } of sidebarNavigation) {
      expect(markup).toContain(`<a `);
      expect(markup).toContain(`href="${href}"`);
      expect(markup).toContain(label);
    }
  });

  it('points page links to existing app routes and section links to existing targets', () => {
    for (const { href } of sidebarNavigation) {
      const [pathname, fragment] = href.split('#');
      const routePath = pathname === '/' ? 'page.tsx' : `${pathname.slice(1)}/page.tsx`;
      expect(existsSync(resolve(process.cwd(), 'app', routePath)), `${href} should resolve to a route`).toBe(true);

      if (fragment === 'my-research') {
        expect(readFileSync(resolve(process.cwd(), 'app/page.tsx'), 'utf8')).toContain('id="my-research"');
      }
      if (fragment === 'research-search') {
        expect(readFileSync(resolve(process.cwd(), 'app/components/intelligence-panel.tsx'), 'utf8')).toContain('id="research-search"');
      }
    }
  });
});
