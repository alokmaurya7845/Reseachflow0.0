export const sidebarNavigation = [
  { icon: '⌂', label: 'Dashboard', href: '/', active: true },
  { icon: '▣', label: 'My Research', href: '/#my-research', active: false },
  { icon: '◈', label: 'Sources', href: '/sources', active: false },
  { icon: '◫', label: 'Collections', href: '/collections', active: false },
  { icon: '⌕', label: 'Search', href: '/#research-search', active: false },
  { icon: '✦', label: 'AI Chat', href: '/research-chat', active: false },
  { icon: '▧', label: 'Reports', href: '/reports', active: false },
  { icon: '⚙', label: 'Settings', href: '/settings', active: false },
] as const;
