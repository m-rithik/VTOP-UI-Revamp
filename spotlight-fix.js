(function() {
  console.log('🔧 Spotlight Fix: Custom Spotlight arrangement loaded');

  // Add CSS for layout adjustments and toggle button
  const style = document.createElement('style');
  style.innerHTML = `
    .vtop-enhance-mainrow-margin {
      margin-top: 10px !important;
    }
    .vtop-enhance-left-col {
      flex: 0 0 60% !important;
      max-width: 60% !important;
    }
    .vtop-enhance-right-col {
      flex: 0 0 40% !important;
      max-width: 40% !important;
      display: flex !important;
      flex-direction: column;
      height: 100%;
      min-height: 600px;
      justify-content: flex-start;
      margin-top: 0 !important;
    }
    .vtop-enhance-spotlight-flexfill {
      flex: 1 1 auto;
      min-height: 400px;
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 24px 16px 24px !important;
      display: flex;
      flex-direction: column;
      justify-content: stretch;
      background: #f8fbff;
      border-radius: 12px;
      box-shadow: 0 2px 16px 0 rgba(44,128,188,0.08);
      margin-top: 0 !important;
    }
    .vtop-enhance-spotlight-flexfill .card-header, .vtop-enhance-spotlight-flexfill .card-body {
      /* font-size: 1.1em !important; */
    }
    .vtop-enhance-proctor-card {
      flex: 0 0 auto;
      margin-top: 16px;
      width: 100%;
    }
    @media (max-width: 991px) {
      .vtop-enhance-left-col, .vtop-enhance-right-col {
        flex: 0 0 100% !important;
        max-width: 100% !important;
        display: block !important;
        min-height: unset !important;
      }
      .vtop-enhance-spotlight-flexfill, .vtop-enhance-proctor-card {
        flex: unset !important;
        margin-top: 0 !important;
        padding: 12px 8px !important;
        font-size: 1rem !important;
      }
    }
    .vtop-enhance-toggle-clubs {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    /* Pretty toggle switch for checkbox */
    .vtop-enhance-toggle-clubs input[type="checkbox"] {
      appearance: none;
      width: 40px;
      height: 22px;
      background: #d1e6f7;
      border-radius: 16px;
      position: relative;
      outline: none;
      cursor: pointer;
      transition: background 0.3s;
      box-shadow: 0 1px 4px rgba(44,128,188,0.10);
    }
    .vtop-enhance-toggle-clubs input[type="checkbox"]:checked {
      background: #2c80bc;
    }
    .vtop-enhance-toggle-clubs input[type="checkbox"]::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 3px;
      width: 16px;
      height: 16px;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.3s;
      box-shadow: 0 1px 2px rgba(44,128,188,0.15);
    }
    .vtop-enhance-toggle-clubs input[type="checkbox"]:checked::before {
      transform: translateX(18px);
    }
  `;
  document.head.appendChild(style);

  function rearrangeDashboard() {
    // Find the main dashboard row
    let mainRow = document.querySelector('.row.p-1.p-md-2.p-lg-3');
    if (!mainRow) mainRow = document.querySelector('#b5-pagewrapper .row');
    if (!mainRow) return false;
    mainRow.classList.add('vtop-enhance-mainrow-margin');

    // Get left and right columns
    let leftCol = mainRow.querySelector('.col-12.col-md-8');
    let rightCol = mainRow.querySelector('.col-12.col-md-4');
    if (!leftCol || !rightCol) {
      const cols = mainRow.querySelectorAll('.col-12');
      if (cols.length >= 2) {
        leftCol = cols[0];
        rightCol = cols[1];
      }
    }
    if (!leftCol || !rightCol) return false;
    leftCol.classList.add('vtop-enhance-left-col');
    rightCol.classList.add('vtop-enhance-right-col');

    // --- 1. Hide CGPA and Last Five Feedback Details ---
    const cgpaCard = rightCol.querySelector('#edu-status')?.closest('.card');
    if (cgpaCard) cgpaCard.style.display = 'none';
    const feedbackCard = rightCol.querySelector('#last-five-feedbacks')?.closest('.card');
    if (feedbackCard) feedbackCard.style.display = 'none';

    // --- 2. Move Current Semester and Digital Assignments to the left ---
    const courseCard = leftCol.querySelector('#course-data')?.closest('.card') || rightCol.querySelector('#course-data')?.closest('.card');
    const assignmentsCard = leftCol.querySelector('#digital-assignments')?.closest('.card') || rightCol.querySelector('#digital-assignments')?.closest('.card');
    if (courseCard) {
      leftCol.appendChild(courseCard);
      courseCard.style.display = '';
    }
    if (assignmentsCard) {
      leftCol.appendChild(assignmentsCard);
      assignmentsCard.style.display = '';
    }

    // --- 3. Clubs & Chapters toggle and card below Digital Assignments ---
    const clubsCard = leftCol.querySelector('#events-info-content')?.closest('.card') || rightCol.querySelector('#events-info-content')?.closest('.card');
    let toggleDiv = document.getElementById('vtop-enhance-toggle-clubs');
    if (!toggleDiv) {
      toggleDiv = document.createElement('div');
      toggleDiv.className = 'vtop-enhance-toggle-clubs';
      toggleDiv.id = 'vtop-enhance-toggle-clubs';
      toggleDiv.innerHTML = `
        <input type="checkbox" id="vtop-enhance-clubs-toggle" checked />
        <label for="vtop-enhance-clubs-toggle" style="margin:0;cursor:pointer;font-weight:bold;">Show Clubs & Chapters</label>
      `;
    }
    if (assignmentsCard) {
      if (toggleDiv.parentElement !== leftCol || toggleDiv.nextSibling !== assignmentsCard.nextSibling) {
        leftCol.insertBefore(toggleDiv, assignmentsCard.nextSibling);
      }
      if (clubsCard) {
        leftCol.insertBefore(clubsCard, toggleDiv.nextSibling);
        // Restore checkbox state from localStorage
        const clubsPref = localStorage.getItem('vtop-enhance-clubs-toggle');
        const clubsToggle = document.getElementById('vtop-enhance-clubs-toggle');
        if (clubsPref !== null) {
          clubsToggle.checked = clubsPref === 'true';
        }
        clubsCard.style.display = clubsToggle.checked ? '' : 'none';
        clubsToggle.onchange = () => {
          localStorage.setItem('vtop-enhance-clubs-toggle', clubsToggle.checked);
          clubsCard.style.display = clubsToggle.checked ? '' : 'none';
        };
      }
    }

    // --- 4. Make Spotlight fill space above Proctor Message in the right column (horizontally, with style) ---
    let spotlightRow = null;
    const possibleRows = rightCol.querySelectorAll('.row, .row-cols-1, .row-cols-md-1, .g-1');
    for (const row of possibleRows) {
      if (row.querySelector('.card-header button[data-spotlighttitle]')) {
        spotlightRow = row;
        break;
      }
    }
    if (!spotlightRow) {
      const leftRows = leftCol.querySelectorAll('.row, .row-cols-1, .row-cols-md-1, .g-1');
      for (const row of leftRows) {
        if (row.querySelector('.card-header button[data-spotlighttitle]')) {
          spotlightRow = row;
          break;
        }
      }
    }
    const proctorCard = rightCol.querySelector('#proctor-message')?.closest('.card') || leftCol.querySelector('#proctor-message')?.closest('.card');
    // Remove any previous flex wrappers
    const oldFlex = rightCol.querySelector('.vtop-enhance-spotlight-proctor-flex');
    if (oldFlex) oldFlex.remove();
    if (spotlightRow) {
      spotlightRow.classList.add('vtop-enhance-spotlight-flexfill');
      rightCol.insertBefore(spotlightRow, proctorCard ? proctorCard : null);
      spotlightRow.style.display = '';
    }
    if (proctorCard) {
      proctorCard.classList.add('vtop-enhance-proctor-card');
      rightCol.appendChild(proctorCard);
      proctorCard.style.display = '';
    }
    return true;
  }

  function attemptRearrange() {
    let attempts = 0;
    const maxAttempts = 10;
    function tryRearrange() {
      attempts++;
      if (rearrangeDashboard()) return;
      if (attempts < maxAttempts) setTimeout(tryRearrange, 1000);
    }
    tryRearrange();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptRearrange);
  } else {
    attemptRearrange();
  }

  ['pushState','replaceState'].forEach(fn => {
    const orig = history[fn];
    history[fn] = function() {
      const ret = orig.apply(this, arguments);
      setTimeout(attemptRearrange, 100);
      return ret;
    };
  });
  window.addEventListener('popstate', () => setTimeout(attemptRearrange, 100));
  const observer = new MutationObserver(() => setTimeout(attemptRearrange, 100));
  observer.observe(document.body, { childList: true, subtree: true });
})(); 