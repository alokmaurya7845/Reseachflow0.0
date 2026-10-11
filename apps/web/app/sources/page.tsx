'use client';

import { useCallback, useEffect, useState } from 'react';

type Source = { id: string; title: string | null; url: string; domain: string | null; capturedAt: string; project: { id: string; title: string }; _count: { items: number } };
type IndexingStatus = { scope: 'ALL' | 'PROJECT'; sources: number; researchItems: number; embeddingTotal: number; pending: number; processing: number; completed: number; completedWithVector: number; completedWithoutVector: number; failed: number };

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [status, setStatus] = useState('Loading sources...');
  const [indexStatus, setIndexStatus] = useState<IndexingStatus | null>(null);
  const [indexStatusError, setIndexStatusError] = useState('');
  const [indexingSourceId, setIndexingSourceId] = useState<string | null>(null);
  const [indexMessage, setIndexMessage] = useState('');
  const projectId = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('projectId');

  const loadIndexStatus = useCallback(async () => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const response = await fetch(`/api/intelligence/status${query}`, { credentials: 'include' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? 'Indexing status could not be loaded.');
    setIndexStatus(body);
    setIndexStatusError('');
  }, [projectId]);

  useEffect(() => {
    const query = projectId ? `&projectId=${encodeURIComponent(projectId)}` : '';
    void fetch(`/api/sources?limit=100${query}`, { credentials: 'include' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? 'Sources could not be loaded.');
        setSources(body.items ?? []);
        setStatus('');
      })
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : 'Sources could not be loaded.'));
    void loadIndexStatus().catch((error: unknown) => setIndexStatusError(error instanceof Error ? error.message : 'Indexing status could not be loaded.'));
  }, [loadIndexStatus, projectId]);

  const indexSource = async (sourceId: string) => {
    setIndexingSourceId(sourceId);
    setIndexMessage('');
    try {
      const response = await fetch(`/api/sources/${sourceId}/intelligence`, { method: 'POST', credentials: 'include' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'This source could not be indexed.');
      setIndexMessage(body.count > 0 ? 'Source indexed for research chat.' : 'No indexable content was found for this source.');
      await loadIndexStatus();
    } catch (error) {
      setIndexMessage(error instanceof Error ? error.message : 'This source could not be indexed.');
    } finally {
      setIndexingSourceId(null);
    }
  };

  return <main className="min-h-screen bg-slate-50 p-6 md:p-10"><div className="mx-auto max-w-5xl"><a href="/" className="text-sm font-medium text-indigo-600">&larr; ResearchFlow dashboard</a><header className="mt-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Research library</p><h1 className="mt-2 text-3xl font-semibold">Sources</h1><p className="mt-2 text-slate-500">Sources saved to your research collections.</p></header>{indexStatus && <section aria-label="Research indexing status" className="mt-6 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Research chat evidence</h2><p className="mt-2 text-sm text-slate-600">{indexStatus.sources} sources | {indexStatus.researchItems} research items | {indexStatus.completedWithVector} searchable embeddings</p><p className="mt-1 text-xs text-slate-500">{indexStatus.pending} pending | {indexStatus.processing} processing | {indexStatus.failed} failed | {indexStatus.completedWithoutVector} completed without a vector</p></section>}{indexStatusError && <p role="status" className="mt-6 text-sm text-amber-700">{indexStatusError}</p>}{indexMessage && <p role="status" className="mt-4 text-sm text-indigo-700">{indexMessage}</p>}{status && <p role="status" className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">{status}</p>}<div className="mt-6 space-y-3">{sources.map((source) => <article key={source.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5"><a href={`/projects/${source.project.id}/sources/${source.id}`} className="min-w-0 flex-1"><h2 className="font-semibold text-slate-900">{source.title || source.domain || source.url}</h2><p className="mt-1 break-all text-sm text-slate-500">{source.url}</p><p className="mt-2 text-xs text-slate-400">{source.project.title} | {source._count.items} saved item{source._count.items === 1 ? '' : 's'}</p></a><button type="button" onClick={() => void indexSource(source.id)} disabled={indexingSourceId !== null} className="shrink-0 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50">{indexingSourceId === source.id ? 'Indexing…' : 'Index for chat'}</button></article>)}{!status && sources.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No sources saved yet.</div>}</div></div></main>;
}
