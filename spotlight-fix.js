(function() {
  console.log('🔧 Spotlight Fix: Script loaded');
  
  // Add CSS for layout adjustments
  const style = document.createElement('style');
  style.innerHTML = `
    /* Make left column bigger and right column smaller, and add small top margin */
    .row.bgcolor .col-12.col-md-5.col-xl-4 {
      flex: 0 0 65% !important;
      max-width: 65% !important;
      margin-top: 1rem !important;
    }
    .row.bgcolor .col-12.col-md-7.col-xl-8 {
      flex: 0 0 35% !important;
      max-width: 35% !important;
      margin-top: 1rem !important;
    }
    /* Hide the unwanted beige/cream rectangle in card headers */
    .row.bgcolor .card-header > span.bg-warning {
      display: none !important;
    }
    /* Hide empty or unwanted elements in card headers */
    .row.bgcolor .card-header > div:empty,
    .row.bgcolor .card-header > div[style*="background"]:not(:has(*)) {
      display: none !important;
    }
    /* Make spotlight cards more compact */
    .row.bgcolor .col-12.col-md-7.col-xl-8 .card {
      margin-bottom: 0.75rem !important;
    }
    .row.bgcolor .col-12.col-md-7.col-xl-8 .card-body {
      padding: 0.75rem !important;
    }
    .row.bgcolor .col-12.col-md-7.col-xl-8 .card-header {
      padding: 0.5rem 0.75rem !important;
    }
    /* Compact spotlight buttons */
    .row.bgcolor .col-12.col-md-7.col-xl-8 .btn-sm {
      font-size: 0.75rem !important;
      padding: 0.25rem 0.5rem !important;
    }
    /* Compact spotlight list items */
    .row.bgcolor .col-12.col-md-7.col-xl-8 .list-group-item {
      padding: 0.5rem !important;
    }
    /* Ensure both headings are visible and styled consistently */
    .row.bgcolor .col-12.col-md-7.col-xl-8 .fs-5.fontcolor1.mt-5.fw-bold,
    .row.bgcolor .col-12.col-md-5.col-xl-4 .card-header .fs-6.fontcolor3.fw-bold {
      font-size: 1.1rem !important;
      margin-top: 0 !important;
      margin-bottom: 1rem !important;
      font-weight: bold !important;
      display: block !important;
      color: inherit !important;
    }
    .row.bgcolor .col-12.col-md-5.col-xl-4 .card-header {
      padding: 0.5rem 0.75rem !important;
      margin-top: 0 !important;
    }
  `;
  document.head.appendChild(style);
  
  function rearrangeDashboard() {
    console.log('🔧 Spotlight Fix: Attempting to rearrange dashboard...');
    
    // Find the main dashboard row - try multiple selectors
    let mainRow = document.querySelector('.row.bgcolor');
    if (!mainRow) {
      mainRow = document.querySelector('#b5-pagewrapper .row');
      console.log('🔧 Spotlight Fix: Using fallback selector for main row');
    }
    if (!mainRow) {
      console.log('🔧 Spotlight Fix: Main row not found, skipping...');
      return false;
    }

    // Get left and right columns - try multiple selectors
    let leftCol = mainRow.querySelector('.col-12.col-md-5.col-xl-4');
    let rightCol = mainRow.querySelector('.col-12.col-md-7.col-xl-8');
    
    if (!leftCol || !rightCol) {
      console.log('🔧 Spotlight Fix: Columns not found with primary selectors, trying fallback...');
      const cols = mainRow.querySelectorAll('.col-12');
      if (cols.length >= 2) {
        leftCol = cols[0];
        rightCol = cols[1];
      }
    }
    
    if (!leftCol || !rightCol) {
      console.log('🔧 Spotlight Fix: Columns still not found, aborting...');
      return false;
    }

    console.log('🔧 Spotlight Fix: Found columns, starting rearrangement...');

    // --- 1. Hide CGPA and Last Five Feedback Details ---
    const cgpaCard = leftCol.querySelector('#edu-status')?.closest('.card');
    if (cgpaCard) {
      cgpaCard.style.display = 'none';
      console.log('🔧 Spotlight Fix: Hidden CGPA card');
    }
    
    const feedbackCard = leftCol.querySelector('#last-five-feedbacks')?.closest('.card');
    if (feedbackCard) {
      feedbackCard.style.display = 'none';
      console.log('🔧 Spotlight Fix: Hidden feedback card');
    }

    // --- 2. Move Spotlight to the right ---
    const spotlightHeader = leftCol.querySelector('.fs-5.fontcolor1.mt-5.fw-bold') || 
                           leftCol.querySelector('.fs-5.fontcolor1.fw-bold') ||
                           leftCol.querySelector('[class*="spotlight"]') ||
                           leftCol.querySelector('h5:contains("Spotlight")');
    let spotlightRow = null;
    if (spotlightHeader) {
      spotlightRow = spotlightHeader.closest('.row');
      if (!spotlightRow) {
        // fallback: get all .col-12 under leftCol that contain the header
        spotlightRow = Array.from(leftCol.children).find(child => child.contains(spotlightHeader));
      }
    }
    if (spotlightRow) {
      rightCol.insertBefore(spotlightRow, rightCol.firstChild);
      spotlightRow.style.display = '';
      console.log('🔧 Spotlight Fix: Moved spotlight to right');
    } else if (!window.spotlightNotFoundLogged) {
      console.log('🔧 Spotlight Fix: Spotlight not found (this is normal on some pages)');
      window.spotlightNotFoundLogged = true;
    }

    // --- 3. Move Proctor Message below Spotlight ---
    const proctorCard = leftCol.querySelector('#proctor-message')?.closest('.card');
    if (proctorCard && spotlightRow) {
      rightCol.insertBefore(proctorCard, spotlightRow.nextSibling);
      proctorCard.style.display = '';
      console.log('🔧 Spotlight Fix: Moved proctor message below spotlight');
    } else if (proctorCard) {
      rightCol.insertBefore(proctorCard, rightCol.firstChild);
      proctorCard.style.display = '';
      console.log('🔧 Spotlight Fix: Moved proctor message to right (no spotlight)');
    }

    // --- 4. Move Course Registration and Digital Assignments to the left ---
    const courseCard = rightCol.querySelector('#course-data')?.closest('.card');
    const assignmentsCard = rightCol.querySelector('#digital-assignments')?.closest('.card');
    
    if (assignmentsCard) {
      leftCol.insertBefore(assignmentsCard, leftCol.firstChild);
      assignmentsCard.style.display = '';
      console.log('🔧 Spotlight Fix: Moved digital assignments to left');
    }
    
    if (courseCard) {
      leftCol.insertBefore(courseCard, assignmentsCard ? assignmentsCard.nextSibling : leftCol.firstChild);
      courseCard.style.display = '';
      console.log('🔧 Spotlight Fix: Moved course registration to left');
    }

    console.log('🔧 Spotlight Fix: Dashboard rearrangement completed');
    return true;
  }

  function attemptRearrange() {
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryRearrange() {
      attempts++;
      console.log(`🔧 Spotlight Fix: Attempt ${attempts}/${maxAttempts}`);
      
      if (rearrangeDashboard()) {
        console.log('🔧 Spotlight Fix: Success!');
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(tryRearrange, 2000);
      } else {
        console.log('🔧 Spotlight Fix: Failed after maximum attempts');
      }
    }
    
    tryRearrange();
  }

  // Run on DOM ready and after navigation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptRearrange);
  } else {
    attemptRearrange();
  }

  // Patch navigation events
  ['pushState','replaceState'].forEach(fn => {
    const orig = history[fn];
    history[fn] = function() {
      const ret = orig.apply(this, arguments);
      setTimeout(attemptRearrange, 100);
      return ret;
    };
  });
  window.addEventListener('popstate', () => setTimeout(attemptRearrange, 100));

  // Observe dashboard area for dynamic updates
  const observer = new MutationObserver(() => setTimeout(attemptRearrange, 100));
  observer.observe(document.body, { childList: true, subtree: true });

  // Robust injection: retry and observe
  function robustInjectLoop() {
    attemptRearrange();
    setTimeout(robustInjectLoop, 5000); // Reduced spam
  }
  robustInjectLoop();
})(); 