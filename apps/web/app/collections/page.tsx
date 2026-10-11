'use client';

import { useEffect, useState } from 'react';

type Collection = { id: string; title: string; description: string | null; updatedAt: string; _count: { sources: number } };

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [status, setStatus] = useState('Loading collections...');

  useEffect(() => {
    void fetch('/api/projects?limit=100', { credentials: 'include' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? 'Collections could not be loaded.');
        setCollections(body.items ?? []);
        setStatus('');
      })
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : 'Collections could not be loaded.'));
  }, []);

  return <main className="min-h-screen bg-slate-50 p-6 md:p-10"><div className="mx-auto max-w-5xl"><a href="/" className="text-sm font-medium text-indigo-600">&larr; ResearchFlow dashboard</a><header className="mt-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Research library</p><h1 className="mt-2 text-3xl font-semibold">Collections</h1><p className="mt-2 text-slate-500">Organize and revisit sources by research project.</p></header>{status && <p role="status" className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{status}</p>}<div className="mt-6 grid gap-4 sm:grid-cols-2">{collections.map((collection) => <a key={collection.id} href={`/sources?projectId=${encodeURIComponent(collection.id)}`} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200"><h2 className="font-semibold text-slate-900">{collection.title}</h2>{collection.description && <p className="mt-2 text-sm leading-6 text-slate-500">{collection.description}</p>}<p className="mt-4 text-xs text-slate-400">{collection._count.sources} source{collection._count.sources === 1 ? '' : 's'} - Updated {new Date(collection.updatedAt).toLocaleDateString()}</p></a>)}</div>{!status && collections.length === 0 && <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No collections yet. Create a research project to start organizing sources.</div>}</div></main>;
}
