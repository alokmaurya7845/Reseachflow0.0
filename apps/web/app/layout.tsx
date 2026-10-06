import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'ResearchFlow', description: 'A focused workspace for web research.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
