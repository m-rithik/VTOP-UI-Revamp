// ==UserScript==
// @name         VTOP Mac-like Dock Loader
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Injects the VTOP dock and loading overlay scripts into the page context for full access to VTOP functions.
// ==/UserScript==
(function () {
  // --- Feature injection/removal helpers ---
  function injectScript(filename, id) {
    if (id && document.getElementById(id)) return;
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL(filename);
    if (id) script.id = id;
    script.onload = function () { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
  }
  function removeScript(id) {
    var script = document.getElementById(id);
    if (script) script.remove();
  }
  function injectCSS() {
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
    console.log('[VTOP Enhance] navbar.css injected as <style>');
  }
  function removeCSS() {
    // Remove any <style> tags with a marker for navbar styles
    const styles = document.querySelectorAll('style[data-vtop-enhance-navbar]');
    styles.forEach(style => style.remove());
    document.body.offsetHeight;
    console.log('[VTOP Enhance] navbar.css removed');
  }

  // --- Main update logic ---
  function updateFeatures(settings) {
    if (!settings.extensionEnabled) {
      removeCSS();
      // Remove any feature artifacts if possible (scripts are self-removing, but try)
      // Optionally, reload page or clean up DOM here if needed
      return;
    }
    // TopBar (navbar.css)
    if (settings.topBar) {
      injectCSS();
    } else {
      removeCSS();
    }
    // Dock
    if (settings.dock) {
      injectScript('vtop-dock-inject.js', 'vtop-dock-inject');
    } else {
      // No reliable way to remove injected dock, unless dock script supports it
    }
    // Spotlight
    if (settings.spotlight) {
      injectScript('spotlight-fix.js', 'vtop-spotlight-fix');
    } else {
      // No reliable way to remove injected spotlight, unless script supports it
    }
    // Loading
    if (settings.loading) {
      injectScript('vtop-loading.js', 'vtop-loading');
    } else {
      // No reliable way to remove injected loading, unless script supports it
    }
    // Dark Mode
    if (settings.darkMode) {
      injectScript('darkreader.min.js', 'vtop-darkreader');
      injectScript('darkmode.js', 'vtop-darkmode');
    } else {
      // No reliable way to remove dark mode, unless script supports it
    }
    // PDF Open (handled as a content script, not injected here)
  }

  // --- Initial load ---
  if (chrome?.storage) {
    chrome.storage.local.get({
      extensionEnabled: true,
      dock: true,
      topBar: true,
      spotlight: true,
      loading: true,
      darkMode: false,
      pdfOpen: false
    }, updateFeatures);
    // Listen for changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      chrome.storage.local.get({
        extensionEnabled: true,
        dock: true,
        topBar: true,
        spotlight: true,
        loading: true,
        darkMode: false,
        pdfOpen: false
      }, updateFeatures);
    });
  } else {
    // Fallback: enable all by default
    injectCSS();
    injectScript('vtop-dock-inject.js', 'vtop-dock-inject');
    injectScript('spotlight-fix.js', 'vtop-spotlight-fix');
    injectScript('vtop-loading.js', 'vtop-loading');
    injectScript('darkreader.min.js', 'vtop-darkreader');
    injectScript('darkmode.js', 'vtop-darkmode');
  }
})();
