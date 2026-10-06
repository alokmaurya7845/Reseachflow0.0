export type User = { id: string; email: string; name: string | null; avatarUrl: string | null; plan: 'FREE' | 'PRO'; billingInterval: 'NONE' | 'MONTHLY' | 'YEARLY'; createdAt: string; updatedAt: string };
export type ResearchProject = { id: string; userId: string; title: string; description: string | null; createdAt: string; updatedAt: string };
export type Source = { id: string; projectId: string; url: string; canonicalUrl?: string; title: string | null; domain: string | null; author: string | null; description?: string | null; faviconUrl?: string | null; publishedAt: string | null; capturedAt: string; createdAt: string; updatedAt: string };
export type ResearchItemType = 'NOTE' | 'SELECTION' | 'PAGE_CONTENT';
export type ResearchItem = { id: string; sourceId: string; type: ResearchItemType; content: string; createdAt: string; updatedAt: string };
export * from './ai';

export type PageInfo = {
  url: string;
  title: string;
  domain: string;
  description: string;
  author: string;
  publishedAt: string;
  faviconUrl: string;
  content: string;
  selectedText: string;
  capturedAt: string;
};
export type CaptureKind = 'PAGE_CONTENT' | 'SELECTION';
export type CapturePayload = { kind: CaptureKind; page: PageInfo; content: string };
export type SavePageRequest = { projectId: string; url: string; title?: string; domain?: string; author?: string; publishedAt?: string };
export type SaveSelectionRequest = SavePageRequest & { content: string };

export type ExtensionRequest =
  | { type: 'GET_PAGE_INFO'; selectionOnly?: boolean }
  | { type: 'GET_PROJECTS' }
  | { type: 'CAPTURE_PAGE'; projectId: string; allowDuplicate?: boolean }
  | { type: 'CAPTURE_SELECTION'; projectId: string; allowDuplicate?: boolean }
  | { type: 'SAVE_SOURCE'; projectId: string; capture: CapturePayload; allowDuplicate?: boolean }
  | { type: 'OPEN_DASHBOARD'; projectId?: string; sourceId?: string };

export type ExtensionResponse =
  | { ok: true; type: 'PAGE_INFO'; data: PageInfo }
  | { ok: true; type: 'PROJECTS'; data: ResearchProject[] }
  | { ok: true; type: 'CAPTURE_PREVIEW'; data: CapturePayload }
  | { ok: true; type: 'CAPTURE_SUCCESS'; data: { source: Source; item: ResearchItem } }
  | { ok: true; type: 'DASHBOARD_OPENED' }
  | { ok: false; type: 'CAPTURE_ERROR'; code: string; message: string; existingSourceId?: string };
