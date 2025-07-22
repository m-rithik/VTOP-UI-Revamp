"use strict";
// Background script for VTOP PDF
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type !== "open-pdf" || !msg.dataUrl) return;
  chrome.tabs.create({ url: msg.dataUrl });
}); 

