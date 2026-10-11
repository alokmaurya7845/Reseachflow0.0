import React from 'react';
import Link from 'next/link';
import { sidebarNavigation } from './sidebar-navigation';

export function SidebarNavigation() {
  return (
    <nav aria-label="Main navigation" className="grid gap-1">
      {sidebarNavigation.map(({ icon, label, href, active }) => (
        <Link
          key={label}
          href={href}
          aria-current={active ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <span aria-hidden="true">{icon}</span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
