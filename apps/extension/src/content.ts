import { getPageInfo } from './content/extractor';
chrome.runtime.onMessage.addListener((message: { type?: string; selectionOnly?: boolean }, _sender, sendResponse) => { if (message.type === 'GET_PAGE_INFO') { const info = getPageInfo(); if (message.selectionOnly) info.content = info.selectedText; sendResponse(info); } return true; });
