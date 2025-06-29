// ==UserScript==
// @name         VTOP Mac-like Dock Loader
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Injects the VTOP dock and loading overlay scripts into the page context for full access to VTOP functions.
// ==/UserScript==
(function() {
  function injectScript(filename, onload) {
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL(filename);
    script.onload = function() {
      this.remove();
      if (onload) onload();
    };
    (document.head || document.documentElement).appendChild(script);
  }
  injectScript('vtop-dock-inject.js');
  injectScript('vtop-loading.js');
  injectScript('spotlight-fix.js');
  injectScript('topbar-fix.js');
  // Inject darkreader.min.js, then darkmode.js only after it's loaded
  injectScript('darkreader.min.js', function() {
    injectScript('darkmode.js');
  });
})();
