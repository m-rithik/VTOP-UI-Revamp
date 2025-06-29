(function() {
  // --- CSS for loading overlay ---
  const style = document.createElement('style');
  style.innerHTML = `
    #vtop-loading-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.35);
      transition: opacity 0.25s cubic-bezier(.4,0,.2,1), visibility 0.25s cubic-bezier(.4,0,.2,1);
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    #vtop-loading-overlay.active {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }
    #vtop-loading-overlay.fade-out {
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
      transition: opacity 0.25s cubic-bezier(.4,0,.2,1), visibility 0.25s cubic-bezier(.4,0,.2,1);
    }
    .vtop-spinner {
      width: 64px;
      height: 64px;
      border: 6px solid #e3e8fd;
      border-top: 6px solid #3949ab;
      border-radius: 50%;
      animation: vtop-spin 1s linear infinite;
      background: rgba(255,255,255,0.7);
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    }
    @keyframes vtop-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // --- Loading overlay element ---
  let overlay = document.getElementById('vtop-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'vtop-loading-overlay';
    overlay.innerHTML = '<div class="vtop-spinner"></div>';
    document.body.appendChild(overlay);
  }

  // --- Aggressively remove VTOP's BlockUI overlays and #popup ---
  let blockUIObserver = null;
  function removeBlockUIOverlays() {
    document.querySelectorAll('.blockUI').forEach(el => el.parentNode && el.parentNode.removeChild(el));
    document.querySelectorAll('body > #popup').forEach(el => el.parentNode && el.parentNode.removeChild(el));
  }
  function startBlockUIObserver() {
    if (blockUIObserver) blockUIObserver.disconnect();
    blockUIObserver = new MutationObserver(() => {
      removeBlockUIOverlays();
    });
    blockUIObserver.observe(document.body, { childList: true, subtree: true });
    removeBlockUIOverlays();
  }
  function stopBlockUIObserver() {
    if (blockUIObserver) blockUIObserver.disconnect();
    blockUIObserver = null;
  }

  let fadeTimeout = null;
  function showOverlay() {
    if (fadeTimeout) clearTimeout(fadeTimeout);
    overlay.classList.remove('fade-out');
    overlay.classList.add('active');
    startBlockUIObserver();
  }
  function hideOverlay() {
    overlay.classList.remove('active');
    overlay.classList.add('fade-out');
    stopBlockUIObserver();
    removeBlockUIOverlays();
    fadeTimeout = setTimeout(() => {
      overlay.classList.remove('fade-out');
    }, 250);
  }

  // --- Patch $.blockUI and $.unblockUI to use custom loader ---
  function patchBlockUI() {
    if (window.jQuery && window.jQuery.blockUI && !window.jQuery.blockUI.__vtopEnhancePatched) {
      const origBlockUI = window.jQuery.blockUI;
      window.jQuery.blockUI = function() {
        showOverlay();
      };
      window.jQuery.blockUI.__vtopEnhancePatched = true;
    }
    if (window.jQuery && window.jQuery.unblockUI && !window.jQuery.unblockUI.__vtopEnhancePatched) {
      const origUnblockUI = window.jQuery.unblockUI;
      window.jQuery.unblockUI = function() {
        hideOverlay();
      };
      window.jQuery.unblockUI.__vtopEnhancePatched = true;
    }
  }

  // --- MutationObserver logic for content area with max timeout fallback ---
  let contentObserver = null;
  let maxTimeout = null;
  function observeWrappersAndHideWhenReady() {
    if (contentObserver) contentObserver.disconnect();
    if (maxTimeout) clearTimeout(maxTimeout);
    const wrappers = [
      document.getElementById('b3wrapper'),
      document.getElementById('b5wrapper')
    ].filter(Boolean);
    if (wrappers.length === 0) {
      // Fallback: hide after 3s if wrappers not found
      maxTimeout = setTimeout(hideOverlay, 3000);
      return;
    }
    let contentChanged = false;
    function tryHide() {
      if (contentChanged) {
        hideOverlay();
        if (contentObserver) contentObserver.disconnect();
        if (maxTimeout) clearTimeout(maxTimeout);
      }
    }
    contentObserver = new MutationObserver(() => {
      contentChanged = true;
      tryHide();
    });
    wrappers.forEach(wrap => {
      contentObserver.observe(wrap, { childList: true, subtree: true });
    });
    // Max timeout fallback (3s)
    maxTimeout = setTimeout(() => {
      hideOverlay();
      if (contentObserver) contentObserver.disconnect();
    }, 3000);
  }

  // --- Patch VTOP's ajaxCall and ajaxB5Call ---
  function patchVtopAjax() {
    // Patch ajaxCall
    if (typeof window.ajaxCall === 'function' && !window.ajaxCall.__vtopEnhancePatched) {
      const origAjaxCall = window.ajaxCall;
      window.ajaxCall = function(url, data, ...args) {
        showOverlay();
        observeWrappersAndHideWhenReady();
        return origAjaxCall.call(this, url, data, ...args);
      };
      window.ajaxCall.__vtopEnhancePatched = true;
    }
    // Patch ajaxB5Call
    if (typeof window.ajaxB5Call === 'function' && !window.ajaxB5Call.__vtopEnhancePatched) {
      const origAjaxB5Call = window.ajaxB5Call;
      window.ajaxB5Call = function(url, data, ...args) {
        showOverlay();
        observeWrappersAndHideWhenReady();
        return origAjaxB5Call.call(this, url, data, ...args);
      };
      window.ajaxB5Call.__vtopEnhancePatched = true;
    }
  }

  // Wait for VTOP's ajaxCall and ajaxB5Call and jQuery.blockUI to be defined
  function waitForVtopAjaxAndBlockUI() {
    if (
      typeof window.ajaxCall === 'function' &&
      typeof window.ajaxB5Call === 'function' &&
      window.jQuery &&
      window.jQuery.blockUI &&
      window.jQuery.unblockUI
    ) {
      patchVtopAjax();
      patchBlockUI();
    } else {
      setTimeout(waitForVtopAjaxAndBlockUI, 100);
    }
  }
  waitForVtopAjaxAndBlockUI();
})(); 