// --- VTOP PDF Auto-Open with Toggle ---
(() => {
  const TOGGLE_KEY = 'vtop-pdfviewonly-enabled';
  const BUTTON_ID = 'vtop-pdfviewonly-btn';
  const FORM_ID = "getDownloadSemPdfButtonForm";
  const DEBUG = false;

  // Map each form to a pre-opened tab so popup blockers don't kill us
  const pendingWindows = new WeakMap();
  
  // Track handled requests to prevent duplicate tab opening
  const handledRequests = new Set();
  const REQUEST_TIMEOUT = 2000; // Clear handled requests after 2 seconds

  // Squelch any extra window.open while our course-material fetch is in flight
  let _squelchOpenUntil = 0;
  let _squelchTargetWindow = null;
  const SQUELCH_MS = 5000;

  // Pending window reserved during a user gesture (click) so popup blockers don't kill async opens
  let _pendingClickWindow = null;
  let _pendingClickTimer = null;
  function reservePendingWindow(reason) {
    try {
      if (!_pendingClickWindow || _pendingClickWindow.closed) {
        _pendingClickWindow = window.open('', '_blank');
      }
      // Auto-close if not consumed
      if (_pendingClickTimer) clearTimeout(_pendingClickTimer);
      _pendingClickTimer = setTimeout(() => {
        try { if (_pendingClickWindow && !_pendingClickWindow.closed) _pendingClickWindow.close(); } catch(_) {}
        _pendingClickWindow = null;
      }, 4000);
    } catch(_) {}
  }
  function consumePendingWindow() {
    if (_pendingClickTimer) { clearTimeout(_pendingClickTimer); _pendingClickTimer = null; }
    const w = _pendingClickWindow;
    _pendingClickWindow = null;
    return w;
  }

  function peekPendingWindow() {
    try { return (_pendingClickWindow && !_pendingClickWindow.closed) ? _pendingClickWindow : null; } catch (_) { return null; }
  }

  // Ensure site code that calls window.open reuses our reserved tab and collapses duplicates
  (function patchWindowOpen(){
    if (window._vtopPdfPatchedOpen) return;
    window._vtopPdfPatchedOpen = true;
    const nativeOpen = window.open.bind(window);
    window.open = function(url, name, specs){
      try {
        const now = Date.now();
        const u = (typeof url === 'string') ? url : '';

        // While squelch is active, force any window.open to reuse our target tab
        if (now < _squelchOpenUntil) {
          const target = (_squelchTargetWindow && !_squelchTargetWindow.closed) ? _squelchTargetWindow : peekPendingWindow();
          if (target) {
            if (u && u !== 'about:blank') {
              try { target.location.href = u; } catch(_) {}
            }
            return target;
          }
        }

        // Default behavior: if about:blank, reuse reserved
        const isBlank = !u || u === 'about:blank';
        if (isBlank) {
          const reserved = peekPendingWindow();
          if (reserved) return reserved;
        }
      } catch(_) {}
      return nativeOpen(url, name, specs);
    };
  })();
  function getPendingWindow() {
    try { return peekPendingWindow() || window.open('', '_blank'); } catch (_) { return null; }
  }
  
  // Helper functions for request tracking
  function createRequestKey(method, url, formData) {
    const baseKey = `${method}:${url}`;
    if (formData) {
      const entries = [];
      if (formData instanceof FormData) {
        for (const [key, value] of formData.entries()) {
          entries.push([String(key), value instanceof File ? (value.name || '') : String(value)]);
        }
      } else if (formData instanceof HTMLFormElement) {
        const fd = new FormData(formData);
        for (const [key, value] of fd.entries()) {
          entries.push([String(key), value instanceof File ? (value.name || '') : String(value)]);
        }
      } else if (typeof formData === 'string' || formData instanceof URLSearchParams) {
        const usp = formData instanceof URLSearchParams ? formData : new URLSearchParams(String(formData));
        for (const [k, v] of usp.entries()) entries.push([String(k), String(v)]);
      }
      entries.sort((a,b)=> a[0]===b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0]));
      const enc = entries.map(([k,v])=> encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&');
      return `${baseKey}:${enc}`;
    }
    return baseKey;
  }
  
  function isRequestHandled(method, url, formData) {
    const key = createRequestKey(method, url, formData);
    return handledRequests.has(key);
  }
  
  function markRequestHandled(method, url, formData) {
    const key = createRequestKey(method, url, formData);
    if (DEBUG) console.log('[VTOP-AutoOpen] Marking request as handled:', key);
    handledRequests.add(key);
    // Auto-clear after timeout
    setTimeout(() => {
      if (DEBUG) console.log('[VTOP-AutoOpen] Clearing handled request:', key);
      handledRequests.delete(key);
    }, REQUEST_TIMEOUT);
    return key;
  }

  // --- Generic PDF detection + opener (NEW) ---
  function isLikelyPdfUrl(u) {
    try {
      const url = new URL(u, location.origin);
      const path = (url.pathname || '').toLowerCase();
      const q = (url.search || '').toLowerCase();
      if (q.includes('format=pdf') || q.includes('export=pdf') || q.includes('type=pdf')) return true;
      if (path.includes('dodownloadquestion')) return true;
      if (path.endsWith('.pdf')) return true;
      if (path.includes('download') || path.includes('pdf')) return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  function openBlobPdf(blob, targetWin) {
    try {
      // End any active squelch once we are loading the blob
      _squelchOpenUntil = 0;
      _squelchTargetWindow = null;
      const objUrl = URL.createObjectURL(blob);
      // If we are about to use the reserved click window, finalize it so it won't be auto-closed
      try {
        if (targetWin === _pendingClickWindow) {
          if (_pendingClickTimer) { clearTimeout(_pendingClickTimer); _pendingClickTimer = null; }
          _pendingClickWindow = null;
        }
      } catch(_) {}
      if (targetWin && !targetWin.closed) {
        targetWin.location.replace(objUrl); // no extra history entry
        try { targetWin.focus(); } catch(_) {}
      } else {
        window.open(objUrl, '_blank');
      }
      // Revoke later to avoid leaks
      setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
    } catch (e) {
      console.error('[VTOP-AutoOpen] openBlobPdf failed:', e);
      alert("Couldn't auto-open the document – see console.");
    }
  }

  async function fetchAndOpenPdf(method, url, bodyOrForm, targetWin, skipMarkingHandled = false) {
    try {
      // Check if this request is already being handled
      if (isRequestHandled(method, url, bodyOrForm)) {
        if (DEBUG) console.log('[VTOP-AutoOpen] Request already being handled, skipping:', method, url);
        if (targetWin && !targetWin.closed) {
          try { targetWin.close(); } catch(_) {}
        }
        return false;
      }
      
      // Mark this request as being handled (unless already marked by caller)
      if (!skipMarkingHandled) {
        markRequestHandled(method, url, bodyOrForm);
      }
      
      const init = { method, credentials: 'include' };

      if (method !== 'GET') {
        if (bodyOrForm instanceof HTMLFormElement) {
          const form = bodyOrForm;
          const enc = (form.enctype || 'application/x-www-form-urlencoded').toLowerCase();
          const fd = new FormData(form);
          if (enc.includes('multipart')) {
            init.body = fd; // browser sets multipart boundary
          } else {
            const usp = new URLSearchParams();
            for (const [k, v] of fd.entries()) {
              // No files expected for download endpoints; ensure strings
              usp.append(k, v instanceof File ? (v.name || '') : String(v));
            }
            init.body = usp;
            // Some browsers set this automatically for URLSearchParams, but be explicit
            init.headers = { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' };
          }
        } else if (bodyOrForm) {
          init.body = bodyOrForm;
        }
      }

      const res = await fetch(url, init);
      if (!res.ok) { if (targetWin && !targetWin.closed) { try { targetWin.close(); } catch(_) {} } return false; }

      const ct = (res.headers.get('content-type') || '').toLowerCase();
      const cd = (res.headers.get('content-disposition') || '').toLowerCase();
      const isPdf = ct.includes('application/pdf') || cd.includes('.pdf') || cd.includes('pdf');
      if (!isPdf) { if (targetWin && !targetWin.closed) { try { targetWin.close(); } catch(_) {} } return false; }

      const blob = await res.blob();
      openBlobPdf(blob, targetWin);
      return true;
    } catch (e) {
      console.error('[VTOP-AutoOpen] fetchAndOpenPdf failed:', e);
      if (targetWin && !targetWin.closed) { try { targetWin.close(); } catch(_) {} }
      return false;
    }
  }

  // --- NEW: Sync with chrome.storage.local on load ---
  function syncFromChromeStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ extensionEnabled: true, pdfOpen: true }, (result) => {
        const extensionEnabled = !!result.extensionEnabled;
        const pdfEnabled = !!result.pdfOpen;
        const enabled = extensionEnabled && pdfEnabled;
        localStorage.setItem(TOGGLE_KEY, enabled ? '1' : '0');
        updateButton();
      });
    } else {
      updateButton();
    }
  }

  // Toggle state management
  function getToggleState() {
    return localStorage.getItem(TOGGLE_KEY) === '1';
  }
  
  function setToggleState(enabled) {
    localStorage.setItem(TOGGLE_KEY, enabled ? '1' : '0');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ pdfOpen: enabled });
    }
    updateButton();
  }

  // Create toggle button
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.setAttribute('data-vtop-toggle','1');
    btn.type = 'button';
    btn.id = BUTTON_ID;
    btn.textContent = 'PDF VIEW ONLY';
    btn.style.cssText = `
      background: ${getToggleState() ? '#43a047' : '#f8f9fa'};
      color: ${getToggleState() ? 'white' : '#212529'};
      border: 2px solid ${getToggleState() ? '#43a047' : '#dee2e6'};
      padding: 6px 12px;
      margin-right: 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: ${getToggleState() ? 'bold' : 'normal'};
      transition: all 0.2s ease;
      box-shadow: ${getToggleState() ? '0 2px 4px rgba(67, 160, 71, 0.3)' : 'none'};
    `;
    
    btn.onclick = function(e) {
      e.stopPropagation();
      const currentState = getToggleState();
      setToggleState(!currentState);
      updateButton();
    };
    
    return btn;
  }

  // Update button appearance
  function updateButton() {
    const btn = document.getElementById(BUTTON_ID);
    if (btn) {
      const isEnabled = getToggleState();
      btn.style.background = isEnabled ? '#43a047' : '#f8f9fa';
      btn.style.color = isEnabled ? 'white' : '#212529';
      btn.style.borderColor = isEnabled ? '#43a047' : '#dee2e6';
      btn.style.fontWeight = isEnabled ? 'bold' : 'normal';
      btn.style.boxShadow = isEnabled ? '0 2px 4px rgba(67, 160, 71, 0.3)' : 'none';
      btn.textContent = 'PDF VIEW ONLY';
    }
  }

  // Inject button next to dark mode button
  function injectButton() {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) return;
    
    const darkBtn = document.getElementById('vtop-darkmode-btn');
    if (!darkBtn) return;
    
    const btn = createToggleButton();
    darkBtn.parentNode.insertBefore(btn, darkBtn);
  }

  // --- Intercept window.fetch to catch JS-driven PDF downloads (re-enabled with dedupe) ---
  (function patchFetch(){
    if (!window.fetch || window._vtopPdfPatchedFetch) return;
    const nativeFetch = window.fetch.bind(window);
    window._vtopPdfPatchedFetch = true;

    window.fetch = function(input, init){
      try {
        const url = (typeof input === 'string') ? input : (input && input.url) || '';
        const method = ((init && init.method) || 'GET').toUpperCase();
        const looksLikePdfUrl = isLikelyPdfUrl(url);

        // If this exact request was proactively handled elsewhere, don't double-handle
        if (looksLikePdfUrl && isRequestHandled(method, url, init && init.body)) {
          if (DEBUG) console.log('[VTOP-AutoOpen] Fetch intercepted but already handled, skipping:', method, url);
          return nativeFetch(input, init);
        }

        return nativeFetch(input, init).then((res) => {
          try {
            if (!getToggleState()) return res;
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            const cd = (res.headers.get('content-disposition') || '').toLowerCase();
            const isPdf = ct.includes('application/pdf') || cd.includes('.pdf') || cd.includes('pdf');
            if (!isPdf) return res;

            // Double-check - if someone else already handled this exact request, skip
            if (isRequestHandled(method, url, init && init.body)) {
              if (DEBUG) console.log('[VTOP-AutoOpen] Fetch response is PDF but already handled, skipping:', method, url);
              return res;
            }

            // Mark handled to prevent other paths from also acting on it
            markRequestHandled(method, url, init && init.body);

            const pending = getPendingWindow();
            res.clone().blob().then((blob) => {
              openBlobPdf(blob, pending);
            }).catch(() => {
              try { if (pending && !pending.closed) pending.close(); } catch(_) {}
            });
          } catch(_) {}
          return res;
        });
      } catch(_) {
        return nativeFetch(input, init);
      }
    };
  })();

  // --- Intercept XMLHttpRequest to catch legacy AJAX downloads (re-enabled with dedupe) ---
  (function patchXHR(){
    if (!window.XMLHttpRequest || window._vtopPdfPatchedXHR) return;
    window._vtopPdfPatchedXHR = true;
    const XHR = window.XMLHttpRequest;
    const origOpen = XHR.prototype.open;
    const origSend = XHR.prototype.send;

    XHR.prototype.open = function(method, url){
      this._vtopMethod = (method || 'GET').toString().toUpperCase();
      this._vtopUrl = url || '';
      return origOpen.apply(this, arguments);
    };

    XHR.prototype.send = function(body){
      if (!this._vtopListenersAttached) {
        this.addEventListener('load', () => {
          try {
            if (!getToggleState()) return;
            const headers = this.getAllResponseHeaders();
            const ctMatch = /content-type:\s*([^\n\r]+)/i.exec(headers);
            const cdMatch = /content-disposition:\s*([^\n\r]+)/i.exec(headers);
            const ct = (ctMatch ? ctMatch[1] : '').toLowerCase();
            const cd = (cdMatch ? cdMatch[1] : '').toLowerCase();
            const isPdf = ct.includes('application/pdf') || cd.includes('.pdf') || cd.includes('pdf');
            if (!isPdf) return;

            const method = this._vtopMethod || 'GET';
            const url = this._vtopUrl || '';
            if (isRequestHandled(method, url, body)) return;
            markRequestHandled(method, url, body);

            // Prefer any pre-opened tab from the user click
            const pending = getPendingWindow();

            let blob = null;
            if (this.responseType === 'blob' && this.response) blob = this.response;
            else if (this.responseType === 'arraybuffer' && this.response) blob = new Blob([this.response], { type: 'application/pdf' });

            if (blob) {
              openBlobPdf(blob, pending);
            } else if (method === 'GET' && url) {
              fetchAndOpenPdf('GET', url, undefined, pending, true);
            } else {
              try { if (pending && !pending.closed) pending.close(); } catch(_) {}
            }
          } catch(_) {}
        });
        this._vtopListenersAttached = true;
      }
      return origSend.apply(this, arguments);
    };
  })();

  // Original VTOP-AutoOpen logic (REPLACED for generic PDF detection)
  const nativeSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function (...args) {
    if (getToggleState()) {
      const method = (this.getAttribute('method') || 'GET').toUpperCase();
      const action = this.getAttribute('action') || this.action || location.href;
      if (isLikelyPdfUrl(action)) {
        // Check if this programmatic form submission is already being handled
        if (isRequestHandled(method, action, this)) {
          if (DEBUG) console.log('[VTOP-AutoOpen] Programmatic form submission already being handled, skipping:', method, action);
          return;
        }
        
        const pending = getPendingWindow();
        fetchAndOpenPdf(method, action, this, pending).then((ok) => {
          if (!ok) {
            try { if (pending && !pending.closed) pending.close(); } catch(_) {}
            nativeSubmit.apply(this, args);
          }
        });
        return;
      }
    }
    return nativeSubmit.apply(this, args);
  };

  // Handle consolidated course page download
  async function handleConsolidatedDownload(fileId, pendingWin) {
    try {
      // Create a hidden form similar to the original approach
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/vtop/downloadCourseMaterialFacultyPdf';
      form.style.display = 'none';
      
      // Add required fields
      const fileIdInput = document.createElement('input');
      fileIdInput.type = 'hidden';
      fileIdInput.name = 'fileId';
      fileIdInput.value = fileId;
      form.appendChild(fileIdInput);
      
      // Try to find and add _csrf if available
      const csrfInput = document.querySelector('input[name="_csrf"]');
      if (csrfInput) {
        const csrfField = document.createElement('input');
        csrfField.type = 'hidden';
        csrfField.name = '_csrf';
        csrfField.value = csrfInput.value;
        form.appendChild(csrfField);
      }
      
      // Try to find and add authorizedID if available
      const authInput = document.querySelector('input[name="authorizedID"]');
      if (authInput) {
        const authField = document.createElement('input');
        authField.type = 'hidden';
        authField.name = 'authorizedID';
        authField.value = authInput.value;
        form.appendChild(authField);
      } else {
        // Try to extract from navbar text
        const navbarText = document.querySelector('.navbar-text.text-light.small.fw-bold');
        if (navbarText) {
          const match = navbarText.textContent.match(/([A-Z0-9]+)\s*\\(STUDENT\\)/);
          if (match) {
            const authField = document.createElement('input');
            authField.type = 'hidden';
            authField.name = 'authorizedID';
            authField.value = match[1];
            form.appendChild(authField);
          }
        }
      }

      // Add form to page temporarily (not required for FormData, but safe)
      document.body.appendChild(form);

      // Use the exact body we'll send for dedupe so fetch/XHR patches won't also open a tab
      const fd = new FormData(form);
      // Mark as handled BEFORE making the fetch request so interceptors won't also act
      markRequestHandled('POST', form.action, fd);

      const pending = (pendingWin && !pendingWin.closed) ? pendingWin : getPendingWindow();
      // Activate squelch so any site window.open during this flow reuses our tab
      _squelchTargetWindow = pending;
      _squelchOpenUntil = Date.now() + SQUELCH_MS;

      const res = await fetch(form.action, {
        method: "POST",
        credentials: "include",
        body: fd
      });
      
      // Clean up
      document.body.removeChild(form);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      openBlobPdf(blob, pending);
    } catch (e) {
      console.error("[VTOP-AutoOpen] failed:", e);
      alert("Couldn't auto-open the document – see console.");
    }
  }

  document.addEventListener(
    "click",
    (ev) => {
      // Ignore clicks on our own toggle (robust to text nodes/shadow DOM)
      {
        const first = (ev.composedPath && ev.composedPath()[0]) || ev.target;
        const node = first && first.nodeType === 3 ? first.parentElement : first;
        if (node && node.closest && node.closest('#' + BUTTON_ID + ',[data-vtop-toggle="1"]')) {
          return;
        }
      }
      if (!getToggleState()) return; // Check toggle state
      
      if (DEBUG) console.log('[VTOP-AutoOpen] Click detected on:', ev.target);

      // Heuristic: if the clicked control looks like it will trigger a download via JS,
      // pre-open a tab tied to this user gesture so popup blockers allow it.
      (function(){
        const el = ev.target.closest('a,button,[role="button"],[data-download-url]');
        if (!el) return;
        // Do not pre-open for our toggle button under any circumstances
        if (el.id === BUTTON_ID || (el.closest && (el.closest('#' + BUTTON_ID) || el.closest('[data-vtop-toggle="1"]')))) return;
        const txt = (el.textContent || '').toLowerCase();
        const href = (el.getAttribute && el.getAttribute('href')) || '';
        // More precise keywords to avoid false positives (e.g., our toggle text contains "PDF"/"VIEW")
        const looksDownloadish = /\b(download|question|paper|pdf)\b/i.test(txt) ||
                                 isLikelyPdfUrl(href) ||
                                 el.hasAttribute('data-download-url') ||
                                 (el.dataset && (el.dataset.code || el.dataset.classid));
        if (looksDownloadish) reservePendingWindow('click-heuristic');
      })();

      // If a submit-like control is clicked, associate the reserved tab to that form
      const submitBtn = ev.target.closest('button, input[type="submit"]');
      if (submitBtn) {
        const form = submitBtn.form || ev.target.closest('form');
        if (form) {
          const action = form.getAttribute('action') || form.action || '';
          if (isLikelyPdfUrl(action) && !pendingWindows.get(form)) {
            try {
              const p = peekPendingWindow();
              if (p) pendingWindows.set(form, p);
            } catch (_) {}
          }
        }
      }

      // Special case: Question download button (Exam) – JS builds POST; handle explicitly
      const qBtn = ev.target.closest('#downloadQuestion, [name="downloadQuestion"]');
      if (qBtn) {
        if (!getToggleState()) return; // respect toggle

        const code = qBtn.getAttribute('data-code') || (qBtn.dataset && qBtn.dataset.code);
        const classIdNumber = qBtn.getAttribute('data-classid') || (qBtn.dataset && (qBtn.dataset.classid || qBtn.dataset.classIdNumber));
        const requestKey = `POST:/vtop/examinations/doDownloadQuestion/:code=${code},classIdNumber=${classIdNumber}`;

        // Check if this Question download is already being handled
        if (handledRequests.has(requestKey)) {
          if (DEBUG) console.log('[VTOP-AutoOpen] Question download already being handled, skipping:', code, classIdNumber);
          return;
        }

        ev.preventDefault();
        ev.stopImmediatePropagation();

        // Mark this request as being handled
        handledRequests.add(requestKey);
        setTimeout(() => handledRequests.delete(requestKey), REQUEST_TIMEOUT);

        const params = new URLSearchParams();

        // Append CSRF tokens (pages sometimes render duplicates)
        const csrfEls = document.querySelectorAll('input[name="_csrf"]');
        if (csrfEls.length) csrfEls.forEach((el) => params.append('_csrf', el.value));

        // authorizedID
        let auth = '';
        const authEl = document.querySelector('input[name="authorizedID"]');
        if (authEl) auth = authEl.value;
        if (!auth) {
          const navbarText = document.querySelector('.navbar-text.text-light.small.fw-bold');
          if (navbarText) {
            const m = navbarText.textContent && navbarText.textContent.match(/([A-Z0-9]{5,})/);
            if (m) auth = m[1];
          }
        }
        if (auth) params.append('authorizedID', auth);

        if (code) params.append('code', code);
        if (classIdNumber) params.append('classIdNumber', classIdNumber);

        const pending = getPendingWindow();
        fetchAndOpenPdf('POST', '/vtop/examinations/doDownloadQuestion/', params, pending).then((ok) => {
          if (!ok) {
            try { if (pending && !pending.closed) pending.close(); } catch(_) {}
            // Fallback: let the site handle it normally
            try { qBtn.click(); } catch (_) {}
          }
        });
        return;
      }

      // Special case: DA download button generates form POST via JS; handle explicitly
      const daBtn = ev.target.closest('#downloadStudentDA, [name="downloadStudentDA"]');
      if (daBtn) {
        if (!getToggleState()) return; // respect toggle
        
        const code = daBtn.getAttribute('data-code') || daBtn.dataset.code;
        const classId = daBtn.getAttribute('data-classid') || daBtn.dataset.classid;
        const requestKey = `POST:/vtop/examinations/downloadSTudentDA/:code=${code},classId=${classId}`;
        
        // Check if this DA download is already being handled
        if (handledRequests.has(requestKey)) {
          if (DEBUG) console.log('[VTOP-AutoOpen] DA download already being handled, skipping:', code, classId);
          return;
        }
        
        ev.preventDefault();
        ev.stopImmediatePropagation();
        
        // Mark this request as being handled
        handledRequests.add(requestKey);
        setTimeout(() => handledRequests.delete(requestKey), REQUEST_TIMEOUT);

        const params = new URLSearchParams();

        // Append CSRF tokens (some pages include duplicates)
        const csrfEls = document.querySelectorAll('input[name="_csrf"]');
        if (csrfEls.length) {
          csrfEls.forEach((el) => params.append('_csrf', el.value));
        }

        // authorizedID
        let auth = '';
        const authEl = document.querySelector('input[name="authorizedID"]');
        if (authEl) auth = authEl.value;
        if (!auth) {
          const navbarText = document.querySelector('.navbar-text.text-light.small.fw-bold');
          if (navbarText) {
            const m = navbarText.textContent && navbarText.textContent.match(/([A-Z0-9]{5,})/);
            if (m) auth = m[1];
          }
        }
        if (auth) params.append('authorizedID', auth);

        if (code) params.append('code1', code);
        if (classId) params.append('classId1', classId);

        const pending = getPendingWindow();
        fetchAndOpenPdf('POST', '/vtop/examinations/downloadSTudentDA/', params, pending).then((ok) => {
          if (!ok) {
            try {
              if (pending && !pending.closed) pending.close();
            } catch (_) {}
            // Fallback: let the site handle it normally
            try {
              daBtn.click();
            } catch (_) {}
          }
        });
        return;
      }

      // Handle direct PDF links (<a href>) anywhere on the site
      const anchor = ev.target.closest('a[href]');
      if (anchor) {
        const href = anchor.href || anchor.getAttribute('href');
        if (href && isLikelyPdfUrl(href)) {
          if (DEBUG) console.log('[VTOP-AutoOpen] Handling direct PDF link:', href);
          
          // Check if this link is already being handled
          if (isRequestHandled('GET', href, undefined)) {
            if (DEBUG) console.log('[VTOP-AutoOpen] Direct PDF link already being handled, skipping:', href);
            return;
          }
          
          ev.preventDefault();
          ev.stopImmediatePropagation();
          
          // Mark as handled immediately to prevent fetch patch from also handling it
          markRequestHandled('GET', href, undefined);
          
          const pending = getPendingWindow();
          fetchAndOpenPdf('GET', href, undefined, pending, true).then((ok) => {
            if (!ok) {
              try { if (pending && !pending.closed) pending.location.href = href; }
              catch(_) { window.location.href = href; }
            }
          });
          return;
        }
      }

      // Handle generic elements exposing a URL through data-download-url
      const dataUrlEl = ev.target.closest('[data-download-url]');
      if (dataUrlEl) {
        const href = dataUrlEl.getAttribute('data-download-url');
        if (href && isLikelyPdfUrl(href)) {
          if (DEBUG) console.log('[VTOP-AutoOpen] Handling data-download-url:', href);
          
          // Check if this download is already being handled
          if (isRequestHandled('GET', href, undefined)) {
            if (DEBUG) console.log('[VTOP-AutoOpen] Data download URL already being handled, skipping:', href);
            return;
          }
          
          ev.preventDefault();
          ev.stopImmediatePropagation();
          
          // Mark as handled immediately
          markRequestHandled('GET', href, undefined);
          
          const pending = getPendingWindow();
          fetchAndOpenPdf('GET', href, undefined, pending, true).then((ok) => {
            if (!ok) {
              try { if (pending && !pending.closed) pending.location.href = href; }
              catch(_) { window.location.href = href; }
            }
          });
          return;
        }
      }

      // Handle old format button
      const oldBtn = ev.target.closest('button[name="getDownloadSemPdf"]');
      if (oldBtn) {
        const form = document.getElementById(FORM_ID);
        if (!form) return;

        ev.preventDefault();
        ev.stopImmediatePropagation();

        form.semSubId.value     = oldBtn.dataset.semid;
        form.classId.value      = oldBtn.dataset.clsid;
        form.materialId.value   = oldBtn.dataset.matid;
        form.materialDate.value = oldBtn.dataset.mdate;

        handleDownload(form);
        return;
      }

      // Handle new consolidated course page button
      const newBtn = ev.target.closest('button[name="downloadmat"]');
      if (newBtn) {
        const fileId = newBtn.dataset.fileid;
        if (!fileId) return;
        
        // Create a unique key for this specific download request
        const downloadUrl = '/vtop/downloadCourseMaterialFacultyPdf';
        const requestKey = `POST:${downloadUrl}:fileId=${fileId}`;
        
        // Check if this download is already being handled
        if (handledRequests.has(requestKey)) {
          if (DEBUG) console.log('[VTOP-AutoOpen] Consolidated download already being handled, skipping:', fileId);
          return;
        }

        ev.preventDefault();
        ev.stopImmediatePropagation();

        // Mark this specific request as being handled immediately
        handledRequests.add(requestKey);
        setTimeout(() => handledRequests.delete(requestKey), REQUEST_TIMEOUT);

        // Reuse a form-associated pending window if one was created earlier
        let pending = null;
        const parentForm = newBtn.form || newBtn.closest('form');
        if (parentForm) {
          pending = pendingWindows.get(parentForm) || null;
          if (pending) pendingWindows.delete(parentForm);
        }
        if (!pending || pending.closed) pending = getPendingWindow();

        handleConsolidatedDownload(fileId, pending);
        return;
      }
    },
    true
  );

  // Intercept user-triggered form submits that likely return PDF and open in a new tab
  document.addEventListener('submit', (ev) => {
    if (!getToggleState()) return;
    const form = ev.target;
    if (!(form instanceof HTMLFormElement)) return;

    const method = (form.getAttribute('method') || 'GET').toUpperCase();
    const action = form.getAttribute('action') || form.action || location.href;
    if (!isLikelyPdfUrl(action)) return;

    // Check if this form submission is already being handled
    if (isRequestHandled(method, action, form)) {
      if (DEBUG) console.log('[VTOP-AutoOpen] Form submission already being handled, skipping:', method, action);
      ev.preventDefault();
      ev.stopImmediatePropagation();
      return;
    }

    ev.preventDefault();
    ev.stopImmediatePropagation();

    let pending = pendingWindows.get(form);
    if (!pending || pending.closed) {
      pending = getPendingWindow();
    }
    pendingWindows.delete(form);

    fetchAndOpenPdf(method, action, form, pending).then((ok) => {
      if (!ok) {
        try { if (pending && !pending.closed) pending.close(); } catch(_) {}
        nativeSubmit.call(form);
      }
    });
  });

  async function handleDownload(form) {
    try {
      // Check if this request is already being handled
      if (isRequestHandled('POST', form.action, form)) {
        if (DEBUG) console.log('[VTOP-AutoOpen] Form download already being handled, skipping:', form.action);
        return;
      }
      
      // Mark this request as being handled
      markRequestHandled('POST', form.action, form);
      
      const pending = getPendingWindow();
      const res = await fetch(form.action, {
        method: "POST",
        credentials: "include",
        body: new FormData(form)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      openBlobPdf(blob, pending);
    } catch (e) {
      console.error("[VTOP-AutoOpen] failed:", e);
      alert("Couldn't auto-open the document – see console.");
    }
  }

  // Initialize
  function init() {
    injectButton();
    syncFromChromeStorage();
    setInterval(injectButton, 1000);
  }

  init();
  
  // Listen for storage changes to handle real-time toggling
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.extensionEnabled || changes.pdfOpen) {
        syncFromChromeStorage();
      }
    });
  }
})();
// --- End VTOP PDF Auto-Open with Toggle ---