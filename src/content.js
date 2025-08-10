// ==UserScript==
// @name         VTOP UI Revamp Loader
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Injects VTOP UI Revamp features (Dock, TopBar, Spotlight, Loading, Tools) based on user settings.
// ==/UserScript==
(function () {
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
    style.textContent = `:root { --ui-scale: 1; }
#vtopHeader {
      position: fixed !important;
      top: calc(8px * var(--ui-scale)) !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 98vw !important;
      max-width: 1800px;
      z-index: 9999 !important;
      background: #2c80bc !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18) !important;
      border-radius: calc(18px * var(--ui-scale)) !important;
      border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
      transition: box-shadow 0.2s, background 0.2s !important;
    }
    body {
      padding-top: calc(66px * var(--ui-scale)) !important;
    }`;
    document.head.appendChild(style);
    console.log('[VTOP UI Revamp] navbar style injected');
  }
  function removeNavbarStyle() {
    document.querySelectorAll('style[data-vtop-enhance-navbar]').forEach(style => style.remove());
    document.body.offsetHeight;
    console.log('[VTOP UI Revamp] navbar style removed');
  }

  // Compute and keep a responsive UI scale in a CSS variable
  function computeAndApplyUIScale() {
    const vv = window.visualViewport;
    const vw = vv?.width || Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = vv?.height || Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    // Baseline desktop 1440x900. Clamp to reasonable range.
    const scaleW = vw / 1440;
    const scaleH = vh / 900;
    let scale = Math.min(scaleW, scaleH);
    // Gentle clamp so it neither shrinks too tiny nor grows absurdly
    scale = Math.max(0.85, Math.min(scale, 1.15));
    document.documentElement.style.setProperty('--ui-scale', scale.toFixed(3));
  }

  function setupUIScaleListeners() {
    if (window.__vtopEnhanceUIScaleSetup) return;
    window.__vtopEnhanceUIScaleSetup = true;
    computeAndApplyUIScale();
    window.addEventListener('resize', computeAndApplyUIScale, { passive: true });
    window.addEventListener('orientationchange', computeAndApplyUIScale, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', computeAndApplyUIScale, { passive: true });
    }
  }

  // --- Main feature toggling ---
  function updateFeatures(settings) {
    if (!settings.extensionEnabled) {
      removeNavbarStyle();
      return;
    }
    // Ensure responsive scaling is active
    setupUIScaleListeners();
    // Dock & TopBar (combined)
    if (settings.dock && settings.topBar) {
      injectNavbarStyle();
      injectScript('src/vtop-dock-inject.js', 'vtop-dock-inject');
    } else {
      removeNavbarStyle();
    }
    // Spotlight
    if (settings.spotlight) {
      injectScript('src/spotlight-fix.js', 'vtop-spotlight-fix');
    }
    // Loading
    if (settings.loading) {
      injectScript('src/vtop-loading.js', 'vtop-loading');
    }
    // Tools (PDF Open & Dark Mode handled elsewhere)
    if (settings.darkMode) {
      injectScript('src/darkreader.min.js', 'vtop-darkreader');
      injectScript('src/darkmode.js', 'vtop-darkmode');
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
    setupUIScaleListeners();
    injectNavbarStyle();
    injectScript('src/vtop-dock-inject.js', 'vtop-dock-inject');
    injectScript('src/spotlight-fix.js', 'vtop-spotlight-fix');
    injectScript('src/vtop-loading.js', 'vtop-loading');
    injectScript('src/darkreader.min.js', 'vtop-darkreader');
    injectScript('src/darkmode.js', 'vtop-darkmode');
  }
})();
