// --- VTOP PDF Auto-Open with Toggle ---
(() => {
  const TOGGLE_KEY = 'vtop-pdfviewonly-enabled';
  const BUTTON_ID = 'vtop-pdfviewonly-btn';
  const FORM_ID = "getDownloadSemPdfButtonForm";

  // Toggle state management
  function getToggleState() {
    return localStorage.getItem(TOGGLE_KEY) === '1';
  }
  
  function setToggleState(enabled) {
    localStorage.setItem(TOGGLE_KEY, enabled ? '1' : '0');
  }

  // Create toggle button
  function createToggleButton() {
    const btn = document.createElement('button');
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

  // Original VTOP-AutoOpen logic
  const nativeSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function (...args) {
    if (this.id === FORM_ID && getToggleState()) {
      handleDownload(this);
      return;                       
    }
    return nativeSubmit.apply(this, args);
  };

  document.addEventListener(
    "click",
    (ev) => {
      if (!getToggleState()) return; // Check toggle state
      
      const btn = ev.target.closest('button[name="getDownloadSemPdf"]');
      if (!btn) return;

      const form = document.getElementById(FORM_ID);
      if (!form) return;

      ev.preventDefault();
      ev.stopImmediatePropagation();

      form.semSubId.value     = btn.dataset.semid;
      form.classId.value      = btn.dataset.clsid;
      form.materialId.value   = btn.dataset.matid;
      form.materialDate.value = btn.dataset.mdate;

      handleDownload(form);
    },
    true
  );

  async function handleDownload(form) {
    try {
      const res = await fetch(form.action, {
        method: "POST",
        credentials: "include",
        body: new FormData(form)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const dataUrl = await new Promise((ok, bad) => {
        const fr = new FileReader();
        fr.onload = () => ok(fr.result);
        fr.onerror = bad;
        fr.readAsDataURL(blob);
      });

      chrome.runtime.sendMessage({ type: "open-pdf", dataUrl });
    } catch (e) {
      console.error("[VTOP-AutoOpen] failed:", e);
      alert("Couldn't auto-open the document – see console.");
    }
  }

  // Initialize
  function init() {
    injectButton();
    
    // Retry button injection
    setInterval(injectButton, 1000);
  }

  init();
})();
// --- End VTOP PDF Auto-Open with Toggle --- 