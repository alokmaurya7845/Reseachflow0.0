'use client';

import { useEffect, useState } from 'react';

type Source = { id: string; title: string | null; url: string; domain: string | null; capturedAt: string; project: { id: string; title: string }; _count: { items: number } };

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [status, setStatus] = useState('Loading sources...');

  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get('projectId');
    const query = projectId ? `&projectId=${encodeURIComponent(projectId)}` : '';
    void fetch(`/api/sources?limit=100${query}`, { credentials: 'include' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? 'Sources could not be loaded.');
        setSources(body.items ?? []);
        setStatus('');
      })
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : 'Sources could not be loaded.'));
  }, []);

  return <main className="min-h-screen bg-slate-50 p-6 md:p-10"><div className="mx-auto max-w-5xl"><a href="/" className="text-sm font-medium text-indigo-600">&larr; ResearchFlow dashboard</a><header className="mt-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Research library</p><h1 className="mt-2 text-3xl font-semibold">Sources</h1><p className="mt-2 text-slate-500">Sources saved to your research collections.</p></header>{status && <p role="status" className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{status}</p>}<div className="mt-6 space-y-3">{sources.map((source) => <a key={source.id} href={`/projects/${source.project.id}/sources/${source.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{source.title || source.domain || source.url}</h2><p className="mt-1 break-all text-sm text-slate-500">{source.url}</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{source.project.title}</span></div><p className="mt-3 text-xs text-slate-400">{source._count.items} saved item{source._count.items === 1 ? '' : 's'} - {new Date(source.capturedAt).toLocaleDateString()}</p></a>)}{!status && sources.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No sources saved yet.</div>}</div></div></main>;
}
