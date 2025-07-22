// ==UserScript==
// @name         VTOP UI Revamp Loader
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Injects VTOP UI Revamp features (Dock, TopBar, Spotlight, Loading, Tools) based on user settings.
// ==/UserScript==
(function () {
  "use strict";
  // --- Helpers ---
  function injectScript(filename, id) {
    if (id && document.getElementById(id)) return;
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(filename);
    if (id) script.id = id;
    script.onload = function () { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
  }
  function injectNavbarStyle() {
    if (document.querySelector('style[data-vtop-enhance-navbar]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-vtop-enhance-navbar', 'true');
    style.textContent = `#vtopHeader {
      position: fixed !important;
      top: 8px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 98vw !important;
      max-width: 1800px;
      z-index: 9999 !important;
      background: #2c80bc !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18) !important;
      border-radius: 18px !important;
      border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
      transition: box-shadow 0.2s, background 0.2s !important;
    }
    body {
      padding-top: 66px !important;
    }`;
    document.head.appendChild(style);
    console.log('[VTOP UI Revamp] navbar style injected');
  }
  function removeNavbarStyle() {
    document.querySelectorAll('style[data-vtop-enhance-navbar]').forEach(style => style.remove());
    document.body.offsetHeight;
    console.log('[VTOP UI Revamp] navbar style removed');
  }

  // --- Main feature toggling ---
  function updateFeatures(settings) {
    if (!settings.extensionEnabled) {
      removeNavbarStyle();
      return;
    }
    // Dock & TopBar (combined)
    if (settings.dock && settings.topBar) {
      injectNavbarStyle();
      injectScript('vtop-dock-inject.js', 'vtop-dock-inject');
    } else {
      removeNavbarStyle();
    }
    // Spotlight
    if (settings.spotlight) {
      injectScript('spotlight-fix.js', 'vtop-spotlight-fix');
    }
    // Loading
    if (settings.loading) {
      injectScript('vtop-loading.js', 'vtop-loading');
    }
    // Tools (PDF Open & Dark Mode handled elsewhere)
    if (settings.darkMode) {
      injectScript('darkreader.min.js', 'vtop-darkreader');
      injectScript('darkmode.js', 'vtop-darkmode');
    }
  }

  // --- Initial load and storage listener ---
  const defaultSettings = {
    extensionEnabled: true,
    dock: true,
    topBar: true,
    spotlight: true,
    loading: true,
    darkMode: true,
    pdfOpen: true
  };
  if (chrome?.storage) {
    chrome.storage.local.get(defaultSettings, updateFeatures);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      chrome.storage.local.get(defaultSettings, updateFeatures);
    });
  } else {
    // Fallback: enable all by default
    injectNavbarStyle();
    injectScript('vtop-dock-inject.js', 'vtop-dock-inject');
    injectScript('spotlight-fix.js', 'vtop-spotlight-fix');
    injectScript('vtop-loading.js', 'vtop-loading');
    injectScript('darkreader.min.js', 'vtop-darkreader');
    injectScript('darkmode.js', 'vtop-darkmode');
  }
})();
