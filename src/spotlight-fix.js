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
    /* Days Left column styling */
    .vtop-enhance-days-left {
      font-weight: bold;
      text-align: center;
    }
    .vtop-enhance-days-left.urgent {
      color: #dc3545 !important;
    }
    .vtop-enhance-days-left.warning {
      color: #fd7e14 !important;
    }
    .vtop-enhance-days-left.safe {
      color: #198754 !important;
    }
    .vtop-enhance-days-left.overdue {
      color: #6c757d !important;
      text-decoration: line-through;
    }
  `;
  document.head.appendChild(style);

  // Function to enhance digital assignments table with days left column
  function enhanceDigitalAssignments() {
    const assignmentsTable = document.querySelector('#digital-assignments table');
    if (!assignmentsTable) {
      console.log('🔧 Spotlight Fix: Digital assignments table not found');
      return false;
    }

    console.log('🔧 Spotlight Fix: Enhancing digital assignments table');

    // Process each row
    const tbody = assignmentsTable.querySelector('tbody');
    if (tbody) {
      const rows = tbody.querySelectorAll('tr');
      console.log(`🔧 Spotlight Fix: Found ${rows.length} assignment rows`);
      
      if (rows.length === 0) {
        console.log('🔧 Spotlight Fix: No rows found, table might be loading dynamically');
        return false;
      }
      
      rows.forEach((row, index) => {
        // Remove existing Days Left cell if it exists
        const existingDaysLeftCell = row.querySelector('td:last-child');
        if (existingDaysLeftCell && existingDaysLeftCell.classList.contains('vtop-enhance-days-left')) {
          existingDaysLeftCell.remove();
          console.log(`🔧 Spotlight Fix: Removed existing Days Left cell from row ${index + 1}`);
        }
        
        // Find the date cell (3rd column - index 2)
        const cells = row.querySelectorAll('td');
        console.log(`🔧 Spotlight Fix: Row ${index + 1} has ${cells.length} cells`);
        
        // Debug: Log all cell contents
        cells.forEach((cell, cellIndex) => {
          console.log(`🔧 Spotlight Fix: Row ${index + 1}, Cell ${cellIndex}: "${cell.textContent.trim()}"`);
        });
        
        if (cells.length >= 3) {
          const dateCell = cells[2]; // Last Date column (3rd cell, index 2)
          const dateText = dateCell.textContent.trim();
          console.log(`🔧 Spotlight Fix: Row ${index + 1} date: "${dateText}"`);
          
          // Check if the date cell actually contains a date
          if (!dateText || dateText === '' || dateText === 'N/A') {
            console.log(`🔧 Spotlight Fix: Row ${index + 1} has empty date cell, skipping`);
            return;
          }
          
          // Find the existing Days Left cell (should be the last cell)
          let daysLeftCell = row.querySelector('.vtop-enhance-days-left');
          if (!daysLeftCell) {
            // If no existing cell, create a new one and insert it in the correct position
            daysLeftCell = document.createElement('td');
            daysLeftCell.className = 'vtop-enhance-days-left';
            daysLeftCell.style.cssText = 'font-weight: bold; text-align: center;';
            
            // Get all cells in the row
            const cells = row.querySelectorAll('td');
            console.log(`🔧 Spotlight Fix: Row ${index + 1} has ${cells.length} cells before adding Days Left`);
            
            // Insert the cell in the correct position (6th column, index 5)
            if (cells.length >= 5) {
              // Insert after the 5th cell (index 4)
              row.insertBefore(daysLeftCell, cells[4].nextSibling);
              console.log(`🔧 Spotlight Fix: Inserted Days Left cell after 5th cell`);
            } else if (cells.length >= 4) {
              // Insert after the 4th cell (index 3)
              row.insertBefore(daysLeftCell, cells[3].nextSibling);
              console.log(`🔧 Spotlight Fix: Inserted Days Left cell after 4th cell`);
            } else {
              // Fallback: append to end
              row.appendChild(daysLeftCell);
              console.log(`🔧 Spotlight Fix: Appended Days Left cell to end`);
            }
          }
          
          // Parse date (format: DD-MM-YYYY)
          const dateParts = dateText.split('-');
          console.log(`🔧 Spotlight Fix: Date parts:`, dateParts);
          
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
            const year = parseInt(dateParts[2]);
            
            console.log(`🔧 Spotlight Fix: Parsed date - Day: ${day}, Month: ${month}, Year: ${year}`);
            
            const dueDate = new Date(year, month, day);
            const currentDate = new Date();
            
            console.log(`🔧 Spotlight Fix: Due date: ${dueDate.toDateString()}, Current date: ${currentDate.toDateString()}`);
            
            // Reset time to start of day for accurate comparison
            dueDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);
            
            const timeDiff = dueDate.getTime() - currentDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            console.log(`🔧 Spotlight Fix: Days difference: ${daysDiff}`);
            
            // Set text and styling based on days left
            if (daysDiff < 0) {
              daysLeftCell.textContent = 'Overdue';
              daysLeftCell.classList.add('overdue');
              daysLeftCell.style.color = '#6c757d';
              daysLeftCell.style.textDecoration = 'line-through';
            } else if (daysDiff === 0) {
              daysLeftCell.textContent = 'Today';
              daysLeftCell.classList.add('urgent');
              daysLeftCell.style.color = '#dc3545';
            } else if (daysDiff === 1) {
              daysLeftCell.textContent = 'Tomorrow';
              daysLeftCell.classList.add('urgent');
              daysLeftCell.style.color = '#dc3545';
            } else if (daysDiff <= 3) {
              daysLeftCell.textContent = `${daysDiff} days`;
              daysLeftCell.classList.add('urgent');
              daysLeftCell.style.color = '#dc3545';
            } else if (daysDiff <= 7) {
              daysLeftCell.textContent = `${daysDiff} days`;
              daysLeftCell.classList.add('warning');
              daysLeftCell.style.color = '#fd7e14';
            } else {
              daysLeftCell.textContent = `${daysDiff} days`;
              daysLeftCell.classList.add('safe');
              daysLeftCell.style.color = '#198754';
            }
          } else {
            daysLeftCell.textContent = 'N/A';
            console.log(`🔧 Spotlight Fix: Invalid date format: "${dateText}"`);
          }
          
          console.log(`🔧 Spotlight Fix: Updated days left cell with text: "${daysLeftCell.textContent}"`);
          
          // Debug: Check if the cell was actually updated
          setTimeout(() => {
            const allCells = row.querySelectorAll('td');
            console.log(`🔧 Spotlight Fix: Row ${index + 1} now has ${allCells.length} cells`);
            const daysLeftCell = row.querySelector('.vtop-enhance-days-left');
            if (daysLeftCell) {
              console.log(`🔧 Spotlight Fix: Days Left cell content: "${daysLeftCell.textContent.trim()}"`);
              console.log(`🔧 Spotlight Fix: Days Left cell classes: "${daysLeftCell.className}"`);
            }
          }, 100);
        }
      });
    }
    return true;
  }

  // Function to retry enhancing the table
  function retryEnhanceDigitalAssignments() {
    let attempts = 0;
    const maxAttempts = 30; // Increased attempts
    
    function tryEnhance() {
      attempts++;
      console.log(`🔧 Spotlight Fix: Attempt ${attempts} to enhance digital assignments`);
      
      const assignmentsTable = document.querySelector('#digital-assignments table');
      if (!assignmentsTable) {
        console.log('🔧 Spotlight Fix: Table not found yet');
        if (attempts < maxAttempts) {
          setTimeout(tryEnhance, 300); // Wait 300ms between attempts
        }
        return;
      }
      
      // Check if table has actual data
      const tbody = assignmentsTable.querySelector('tbody');
      if (!tbody) {
        console.log('🔧 Spotlight Fix: Table body not found yet');
        if (attempts < maxAttempts) {
          setTimeout(tryEnhance, 300);
        }
        return;
      }
      
      const rows = tbody.querySelectorAll('tr');
      if (rows.length === 0) {
        console.log('🔧 Spotlight Fix: No rows found yet');
        if (attempts < maxAttempts) {
          setTimeout(tryEnhance, 300);
        }
        return;
      }
      
      // Check if first row has actual data
      const firstRow = rows[0];
      const cells = firstRow.querySelectorAll('td');
      if (cells.length === 0) {
        console.log('🔧 Spotlight Fix: No cells found in first row yet');
        if (attempts < maxAttempts) {
          setTimeout(tryEnhance, 300);
        }
        return;
      }
      
      // Check if the date cell has actual content
      if (cells.length >= 3) {
        const dateCell = cells[2];
        const dateText = dateCell.textContent.trim();
        if (!dateText || dateText === '') {
          console.log('🔧 Spotlight Fix: Date cell is empty, waiting for data to load');
          if (attempts < maxAttempts) {
            setTimeout(tryEnhance, 300);
          }
          return;
        }
      }
      
      // Check if we have the Uploaded column (at least 4 cells)
      if (cells.length < 4) {
        console.log('🔧 Spotlight Fix: Table doesn\'t have Uploaded column yet, waiting...');
        if (attempts < maxAttempts) {
          setTimeout(tryEnhance, 300);
        }
        return;
      }
      
      // Check if we have at least 3 cells (Course Name, Title, Last Date)
      if (cells.length < 3) {
        console.log('🔧 Spotlight Fix: Table doesn\'t have enough cells yet, waiting...');
        if (attempts < maxAttempts) {
          setTimeout(tryEnhance, 300);
        }
        return;
      }
      
      if (enhanceDigitalAssignments()) {
        console.log('🔧 Spotlight Fix: Successfully enhanced digital assignments');
        // Continue monitoring for changes
        setTimeout(() => retryEnhanceDigitalAssignments(), 2000);
        return;
      }
      
      if (attempts < maxAttempts) {
        console.log(`🔧 Spotlight Fix: Enhancement failed, retrying in 300ms...`);
        setTimeout(tryEnhance, 300);
      } else {
        console.log('🔧 Spotlight Fix: Failed to enhance digital assignments after all attempts');
        // Still continue monitoring
        setTimeout(() => retryEnhanceDigitalAssignments(), 2000);
      }
    }
    
    tryEnhance();
  }

  // Function to continuously monitor and maintain the Days Left column
  function monitorAndMaintainDaysLeft() {
    setInterval(() => {
      const assignmentsTable = document.querySelector('#digital-assignments table');
      if (!assignmentsTable) return;
      
      const tbody = assignmentsTable.querySelector('tbody');
      if (!tbody) return;
      
      const rows = tbody.querySelectorAll('tr');
      let needsEnhancement = false;
      
      // Check if any row is missing the Days Left column or has empty Days Left cells
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        const daysLeftSpan = row.querySelector('.vtop-enhance-days-left');
        
        // Process any row that has at least 3 cells
        if (cells.length >= 3) {
          if (!daysLeftSpan) {
            needsEnhancement = true;
          }
        }
      });
      
      if (needsEnhancement) {
        console.log('🔧 Spotlight Fix: Days Left column missing or empty, re-applying enhancement');
        enhanceDigitalAssignments();
      }
    }, 1000); // Check every second
  }

  // Function to specifically target the Days Left column position
  function updateDaysLeftColumn() {
    const assignmentsTable = document.querySelector('#digital-assignments table');
    if (!assignmentsTable) {
      console.log('🔧 Spotlight Fix: No assignments table found');
      return;
    }
    
    const tbody = assignmentsTable.querySelector('tbody');
    if (!tbody) {
      console.log('🔧 Spotlight Fix: No table body found');
      return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    console.log(`🔧 Spotlight Fix: Found ${rows.length} rows in assignments table`);
    
    if (rows.length === 0) {
      console.log('🔧 Spotlight Fix: No rows found in table');
      return;
    }
    
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      console.log(`🔧 Spotlight Fix: Row ${index + 1} has ${cells.length} cells`);
      
      // Process any row that has at least 3 cells (Course Name, Title, Last Date)
      if (cells.length >= 3) {
        // Get the date from the 3rd cell (index 2)
        const dateCell = cells[2];
        const dateText = dateCell.textContent.trim();
        console.log(`🔧 Spotlight Fix: Row ${index + 1} date: "${dateText}"`);
        
        if (!dateText || dateText === '') {
          console.log(`🔧 Spotlight Fix: Row ${index + 1} has empty date cell, skipping`);
          return;
        }
        
        // Check if we already added days left to this cell
        if (dateCell.querySelector('.vtop-enhance-days-left')) {
          console.log(`🔧 Spotlight Fix: Row ${index + 1} already has days left, skipping`);
          return;
        }
        
        // Calculate days left
        const dateParts = dateText.split('-');
        console.log(`🔧 Spotlight Fix: Date parts:`, dateParts);
        
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1;
          const year = parseInt(dateParts[2]);
          
          console.log(`🔧 Spotlight Fix: Parsed date - Day: ${day}, Month: ${month}, Year: ${year}`);
          
          const dueDate = new Date(year, month, day);
          const currentDate = new Date();
          
          dueDate.setHours(0, 0, 0, 0);
          currentDate.setHours(0, 0, 0, 0);
          
          const timeDiff = dueDate.getTime() - currentDate.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          console.log(`🔧 Spotlight Fix: Days difference: ${daysDiff}`);
          
          // Create a span element for the days left
          const daysLeftSpan = document.createElement('span');
          daysLeftSpan.className = 'vtop-enhance-days-left';
          daysLeftSpan.style.cssText = 'font-weight: bold; margin-left: 10px;';
          
          // Set the content and styling
          if (daysDiff < 0) {
            daysLeftSpan.textContent = ' (Overdue)';
            daysLeftSpan.style.color = '#6c757d';
            daysLeftSpan.style.textDecoration = 'line-through';
          } else if (daysDiff === 0) {
            daysLeftSpan.textContent = ' (Today)';
            daysLeftSpan.style.color = '#dc3545';
          } else if (daysDiff === 1) {
            daysLeftSpan.textContent = ' (Tomorrow)';
            daysLeftSpan.style.color = '#dc3545';
          } else if (daysDiff <= 3) {
            daysLeftSpan.textContent = ` (${daysDiff} days)`;
            daysLeftSpan.style.color = '#dc3545';
          } else if (daysDiff <= 7) {
            daysLeftSpan.textContent = ` (${daysDiff} days)`;
            daysLeftSpan.style.color = '#fd7e14';
          } else {
            daysLeftSpan.textContent = ` (${daysDiff} days)`;
            daysLeftSpan.style.color = '#198754';
          }
          
          // Add the span to the date cell
          dateCell.appendChild(daysLeftSpan);
          console.log(`🔧 Spotlight Fix: Added days left to date cell for row ${index + 1}: "${daysLeftSpan.textContent}"`);
        } else {
          console.log(`🔧 Spotlight Fix: Invalid date format: "${dateText}"`);
        }
      } else {
        console.log(`🔧 Spotlight Fix: Row ${index + 1} doesn't have enough cells (${cells.length}), skipping`);
      }
    });
  }

  function rearrangeDashboard() {
    // Only run on dashboard/home page
    if (!document.getElementById('course-data')) return false;
    // Find the main dashboard row
    let mainRow = document.querySelector('.row.p-1.p-md-2.p-lg-3');
    if (!mainRow) mainRow = document.querySelector('#b5-pagewrapper .row');
    // Only run on home page: require mainRow, leftCol, and rightCol
    let leftCol = null, rightCol = null;
    if (mainRow) {
      leftCol = mainRow.querySelector('.col-12.col-md-8');
      rightCol = mainRow.querySelector('.col-12.col-md-4');
      if (!leftCol || !rightCol) {
        const cols = mainRow.querySelectorAll('.col-12');
        if (cols.length >= 2) {
          leftCol = cols[0];
          rightCol = cols[1];
        }
      }
    }
    if (!mainRow || !leftCol || !rightCol) return false;
    mainRow.classList.add('vtop-enhance-mainrow-margin');
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

    // --- 2.5. Enhance Digital Assignments table with Days Left column ---
    retryEnhanceDigitalAssignments();
    
    // Also try the new approach
    setTimeout(() => {
      updateDaysLeftColumn();
    }, 500);
    
    // Start continuous monitoring
    monitorAndMaintainDaysLeft();

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
  
  // Watch for changes specifically in the digital assignments container
  const digitalAssignmentsContainer = document.getElementById('digital-assignments');
  if (digitalAssignmentsContainer) {
    const assignmentsObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if a table was added
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'TABLE' || node.querySelector('table')) {
                console.log('🔧 Spotlight Fix: New table detected in digital assignments, enhancing...');
                setTimeout(retryEnhanceDigitalAssignments, 100);
              }
            }
          });
        }
      });
    });
    
    assignmentsObserver.observe(digitalAssignmentsContainer, { 
      childList: true, 
      subtree: true 
    });
  }
})(); 