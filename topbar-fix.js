(function() {
  // --- Minimal CSS: only style the top bar, no dropdown/user details changes ---
  const style = document.createElement('style');
  style.innerHTML = `
    #vtopHeader {
      position: fixed !important;
      top: 8px !important;
      left: 50% !important;
      transform: translateX(-50%);
      width: 98vw !important;
      max-width: 1800px;
      z-index: 9999 !important;
      background: #2c80bc !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18);
      border-radius: 18px;
      border: 1.5px solid rgba(255,255,255,0.18);
      transition: box-shadow 0.2s, background 0.2s;
    }
    body {
      padding-top: 66px !important;
    }
  `;
  document.head.appendChild(style);
})(); 