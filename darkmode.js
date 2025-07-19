// --- Begin darkmode.js logic ---
(function() {
  console.log('[VTOP Enhance] darkmode.js loaded');
  const DARKMODE_KEY = 'vtop-enhance-darkmode';
  const TRANSITION_CLASS = 'vtop-darkmode-transition';
  const TRANSITION_DURATION = 190; // ms (very fast, 0.19s)

  // --- NEW: Sync with chrome.storage.local on load ---
  function syncFromChromeStorage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ darkMode: true }, (result) => {
        const enabled = !!result.darkMode;
        localStorage.setItem(DARKMODE_KEY, enabled ? '1' : '0');
        setDarkMode(enabled, true);
      });
    } else {
      // fallback: use localStorage
      const enabled = localStorage.getItem(DARKMODE_KEY) === '1';
      setDarkMode(enabled, true);
    }
  }

  function injectTransitionStyle() {
    if (document.getElementById('vtop-darkmode-transition-style')) return;
    const style = document.createElement('style');
    style.id = 'vtop-darkmode-transition-style';
    style.textContent = `
      html.${TRANSITION_CLASS}, body.${TRANSITION_CLASS} {
        transition: background-color 0.19s cubic-bezier(.4,0,.2,1), color 0.19s cubic-bezier(.4,0,.2,1);
      }
    `;
    document.head.appendChild(style);
  }

  function findUserPhoto() {
    const selectors = [
      '.navbar .dropdown-toggle img',
      'img[alt*="profile" i]',
      'img[alt*="user" i]',
      'img[alt*="photo" i]',
      'img[src*="profile"]',
      'img[src*="avatar"]',
      'img[src*="user"]',
      '.profile-pic',
      '.user-photo',
      '.user-avatar',
      '.dropdown-user img',
      '.navbar-right img',
      'img.img-circle.img_icon_size',
      'img[alt="User Image"]'
    ];
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img) return img;
    }
    return null;
  }

  function createDarkModeButton() {
    const btn = document.createElement('button');
    btn.id = 'vtop-darkmode-btn';
    btn.title = 'Toggle dark mode';
    btn.style.cssText = `
      background: none;
      border: none;
      outline: none;
      cursor: pointer;
      margin-left: 8px;
      padding: 0 4px;
      display: inline-flex;
      align-items: center;
      font-size: 1.5em;
      color: #222;
      transition: color 0.2s;
      vertical-align: middle;
    `;
    
    // Set initial icon based on current state
    const isDarkMode = localStorage.getItem(DARKMODE_KEY) === '1';
    btn.innerHTML = isDarkMode ? 
      `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="currentColor"/></svg>` : // Moon icon
      `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; // Sun icon
    
    return btn;
  }

  function updateButtonIcon(enabled) {
    const btn = document.getElementById('vtop-darkmode-btn');
    if (btn) {
      btn.innerHTML = enabled ? 
        `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="currentColor"/></svg>` : // Moon icon
        `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; // Sun icon
    }
  }

  function setDarkMode(enabled, skipStorage) {
    if (!window.DarkReader) {
      console.error('[VTOP Enhance] DarkReader is not available in setDarkMode.');
      return;
    }
    // Add transition class for smooth shift
    injectTransitionStyle();
    document.documentElement.classList.add(TRANSITION_CLASS);
    document.body.classList.add(TRANSITION_CLASS);
    setTimeout(() => {
      document.documentElement.classList.remove(TRANSITION_CLASS);
      document.body.classList.remove(TRANSITION_CLASS);
    }, TRANSITION_DURATION);
    if (enabled) {
      DarkReader.enable(); // Use default settings
      localStorage.setItem(DARKMODE_KEY, '1');
    } else {
      DarkReader.disable();
      localStorage.setItem(DARKMODE_KEY, '0');
    }
    // Update button icon
    updateButtonIcon(enabled);
    if (!skipStorage && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ darkMode: enabled });
    }
  }

  function injectDarkModeButton() {
    if (document.getElementById('vtop-darkmode-btn')) return;
    const userPhoto = findUserPhoto();
    if (!userPhoto) {
      // console.warn('[VTOP Enhance] User photo not found, cannot inject dark mode button.');
      return;
    }
    const btn = createDarkModeButton();
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const enabled = !window.DarkReader?.isEnabled?.();
      setDarkMode(enabled);
      btn.style.color = '#222';
    });
    // Set initial state from chrome.storage.local
    syncFromChromeStorage();
    btn.style.color = '#222';
    userPhoto.parentNode.insertBefore(btn, userPhoto);
    console.log('[VTOP Enhance] Dark mode button injected to the left of user photo.');
  }

  // --- MutationObserver for robust injection ---
  function observeUserPhoto() {
    injectDarkModeButton();
    const observer = new MutationObserver(() => {
      injectDarkModeButton();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeUserPhoto);
  } else {
    observeUserPhoto();
  }
})();
// --- End darkmode.js logic --- 