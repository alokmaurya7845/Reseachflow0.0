import type { CapturePayload, ExtensionRequest, ExtensionResponse, PageInfo, ResearchItem, ResearchProject, Source } from '@researchflow/shared';

const API_BASE = 'http://localhost:3000';
type StoredState = { currentProjectId?: string; pendingCapture?: CapturePayload };
type SaveResponse = { source: Source; item: ResearchItem };

const getState = (): Promise<StoredState> => new Promise((resolve) => chrome.storage.local.get(['currentProjectId', 'pendingCapture'], (value) => resolve(value as StoredState)));
const setState = (value: StoredState) => new Promise<void>((resolve) => chrome.storage.local.set(value, resolve));
const send = <T>(tabId: number, message: { type: 'GET_PAGE_INFO'; selectionOnly?: boolean }) => new Promise<T>((resolve, reject) => chrome.tabs.sendMessage(tabId, message, (response) => { if (chrome.runtime.lastError || !response) reject(new Error('This page does not allow capture.')); else resolve(response as T); }));
async function pageInfo(tabId: number, selectionOnly = false) { return send<PageInfo>(tabId, { type: 'GET_PAGE_INFO', selectionOnly }); }
async function projects(): Promise<ResearchProject[]> { const response = await fetch(`${API_BASE}/api/projects`, { credentials: 'include' }); if (response.status === 401) throw new Error('Sign in to ResearchFlow before capturing.'); if (!response.ok) throw new Error('ResearchFlow backend is unavailable.'); const body = await response.json() as ResearchProject[] | { items: ResearchProject[] }; return Array.isArray(body) ? body : body.items; }
async function save(projectId: string, capture: CapturePayload, allowDuplicate = false): Promise<ExtensionResponse> {
  const response = await fetch(`${API_BASE}/api/sources`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, url: capture.page.url, title: capture.page.title, domain: capture.page.domain, description: capture.page.description || undefined, faviconUrl: capture.page.faviconUrl || undefined, author: capture.page.author || undefined, publishedAt: capture.page.publishedAt || undefined, content: capture.content, itemType: capture.kind, allowDuplicate }) });
  const body = await response.json().catch(() => ({})) as Partial<SaveResponse> & { error?: string; code?: string; existingSourceId?: string };
  if (!response.ok) return { ok: false, type: 'CAPTURE_ERROR', code: body.code ?? 'SAVE_FAILED', message: body.error ?? 'ResearchFlow could not save this capture.', existingSourceId: body.existingSourceId };
  if (!body.source || !body.item) return { ok: false, type: 'CAPTURE_ERROR', code: 'INVALID_RESPONSE', message: 'ResearchFlow returned an invalid save response.' };
  return { ok: true, type: 'CAPTURE_SUCCESS', data: { source: body.source, item: body.item } };
}
function dashboardUrl(projectId?: string, sourceId?: string) { return `${API_BASE}${sourceId && projectId ? `/projects/${encodeURIComponent(projectId)}/sources/${encodeURIComponent(sourceId)}` : projectId ? `/?project=${encodeURIComponent(projectId)}` : '/'}`; }
async function capture(tabId: number, kind: 'PAGE_CONTENT' | 'SELECTION'): Promise<ExtensionResponse> { const info = await pageInfo(tabId, kind === 'SELECTION'); if (kind === 'SELECTION' && !info.selectedText.trim()) return { ok: false, type: 'CAPTURE_ERROR', code: 'EMPTY_SELECTION', message: 'Select some text on the page first.' }; return { ok: true, type: 'CAPTURE_PREVIEW', data: { kind, page: info, content: kind === 'SELECTION' ? info.selectedText : info.content } }; }

chrome.runtime.onInstalled.addListener(() => { chrome.contextMenus.create({ id: 'capture-selection', title: 'Capture selection with ResearchFlow', contexts: ['selection'] }); });
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabId = tab?.id;
  if (info.menuItemId !== 'capture-selection' || tabId === undefined) return;
  try {
    const state = await getState();
    const captureResult = await capture(tabId, 'SELECTION');
    if (!state.currentProjectId) { if (captureResult.ok && captureResult.type === 'CAPTURE_PREVIEW') await setState({ pendingCapture: captureResult.data }); await chrome.tabs.create({ url: dashboardUrl() }); return; }
    if (!captureResult.ok || captureResult.type !== 'CAPTURE_PREVIEW') return;
    const saved = await save(state.currentProjectId, captureResult.data);
    if (saved.ok && saved.type === 'CAPTURE_SUCCESS') await chrome.tabs.create({ url: dashboardUrl(state.currentProjectId, saved.data.source.id) });
  } catch (error) { console.warn('Context capture failed', error); }
});

chrome.runtime.onMessage.addListener((request: ExtensionRequest, sender, sendResponse: (response: ExtensionResponse) => void) => {
  (async () => {
    try {
      if (request.type === 'GET_PAGE_INFO') { const tabId = sender.tab?.id; if (tabId === undefined) throw new Error('No active tab available.'); sendResponse({ ok: true, type: 'PAGE_INFO', data: await pageInfo(tabId, request.selectionOnly) }); return; }
      if (request.type === 'GET_PROJECTS') { sendResponse({ ok: true, type: 'PROJECTS', data: await projects() }); return; }
      if (request.type === 'CAPTURE_PAGE' || request.type === 'CAPTURE_SELECTION') { const tabId = sender.tab?.id; if (tabId === undefined) throw new Error('No active tab available.'); sendResponse(await capture(tabId, request.type === 'CAPTURE_SELECTION' ? 'SELECTION' : 'PAGE_CONTENT')); return; }
      if (request.type === 'SAVE_SOURCE') { const result = await save(request.projectId, request.capture, request.allowDuplicate); if (result.ok) await setState({ currentProjectId: request.projectId }); sendResponse(result); return; }
      if (request.type === 'OPEN_DASHBOARD') { await chrome.tabs.create({ url: dashboardUrl(request.projectId, request.sourceId) }); sendResponse({ ok: true, type: 'DASHBOARD_OPENED' }); return; }
    } catch (error) { sendResponse({ ok: false, type: 'CAPTURE_ERROR', code: 'CLIENT_ERROR', message: error instanceof Error ? error.message : 'Capture failed.' }); }
  })();
  return true;
});
