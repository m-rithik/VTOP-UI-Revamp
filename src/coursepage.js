
// Course page functionality for VTOP Enhance
// Organizes the "Select Registered Course" dropdown by semester

(function() {
    'use strict';

    // Debug flag - set to true to enable detailed logging
    const DEBUG = true;

    function debugLog(...args) {
        if (DEBUG) {
            console.log('[VTOP Course Sort]', ...args);
        }
    }

    // Function to parse semester code and return a sortable value
    function parseSemesterCode(semesterCode) {
        if (!semesterCode) {
            debugLog('No semester code provided');
            return 0;
        }

        // Extract year and semester type from codes like VL20252601, VL20242505
        // Format: VL + YYYY + YY + SS (where SS is semester type)
        const match = semesterCode.match(/VL(\d{4})(\d{2})(\d{2})/);
        if (!match) {
            debugLog('No match for semester code:', semesterCode);
            return 0;
        }
        
        const fullYear = match[1]; // 2025, 2024, etc.
        const semesterType = match[3]; // 01, 05, etc.
        
        // Convert to a sortable number (higher = more recent)
        const yearValue = parseInt(fullYear);
        
        // For sorting: Within same academic year, Summer > Winter > Fall
        // Fall 2025-26 > Winter 2024-25 > Fall 2024-25 > Winter 2023-24
        let sortValue;
        if (semesterType === '05') {
            // Winter semester: use the year it ends in (e.g., Winter 2024-25 ends in 2025)
            sortValue = yearValue * 10 + 2; // Higher priority for Winter within same year
        } else if (semesterType === '01') {
            // Fall semester: use the year it starts in (e.g., Fall 2024-25 starts in 2024)
            sortValue = yearValue * 10 + 1; // Lower priority for Fall within same year
        } else if (semesterType === '09') {
            // Summer semester: starts in May of the year
            sortValue = yearValue * 10 + 3; // Highest priority for Summer
        } else {
            sortValue = yearValue * 10; // Default for other semester types
        }
        
        debugLog(`Parsed ${semesterCode} -> year: ${yearValue}, type: ${semesterType}, sortValue: ${sortValue}`);
        return sortValue;
    }

    // Function to sort course list elements by semester
    function sortCourseElements(courseElements) {
        if (!courseElements || courseElements.length === 0) {
            debugLog('No course elements to sort');
            return false;
        }

        debugLog(`Sorting ${courseElements.length} course elements`);
        
        // Convert to array and sort
        const elementsArray = Array.from(courseElements);
        
        // Sort elements based on semester code
        elementsArray.sort((a, b) => {
            const semesterA = a.getAttribute('data-semestr');
            const semesterB = b.getAttribute('data-semestr');
            
            if (!semesterA || !semesterB) return 0;
            
            const valueA = parseSemesterCode(semesterA);
            const valueB = parseSemesterCode(semesterB);
            
            // Sort in descending order (most recent first)
            return valueB - valueA;
        });

        // Re-append sorted elements to their parent
        const parent = elementsArray[0].parentElement;
        if (parent) {
            elementsArray.forEach(element => {
                parent.appendChild(element);
            });
            debugLog('Course elements sorted by semester successfully');
            return true;
        } else {
            debugLog('No parent element found for course elements');
            return false;
        }
    }

    // Function to sort course elements by text content (when data-semestr is not available)
    function sortCourseElementsByText(courseElements) {
        if (!courseElements || courseElements.length === 0) {
            debugLog('No course elements to sort by text');
            return false;
        }

        debugLog(`Sorting ${courseElements.length} course elements by text`);
        
        // Convert to array and sort
        const elementsArray = Array.from(courseElements);
        
        // Sort elements based on semester text
        elementsArray.sort((a, b) => {
            const textA = a.textContent || '';
            const textB = b.textContent || '';
            
            const semesterA = extractSemesterFromText(textA);
            const semesterB = extractSemesterFromText(textB);
            
            // Sort in descending order (most recent first)
            return semesterB - semesterA;
        });

        // Re-append sorted elements to their parent
        const parent = elementsArray[0].parentElement;
        if (parent) {
            elementsArray.forEach(element => {
                parent.appendChild(element);
            });
            debugLog('Course elements sorted by semester text successfully');
            return true;
        } else {
            debugLog('No parent element found for course elements');
            return false;
        }
    }

    // Function to extract semester info from text
    function extractSemesterFromText(text) {
        // Look for patterns like "Fall Semester 2025-26", "Winter Semester 2024-25"
        const fallMatch = text.match(/Fall Semester (\d{4})-(\d{2})/);
        const winterMatch = text.match(/Winter Semester (\d{4})-(\d{2})/);
        const summerMatch = text.match(/Summer Semester (\d{4})-(\d{2})/);
        
        if (fallMatch) {
            const year = parseInt(fallMatch[1]);
            return year * 10 + 1; // Fall semester
        } else if (winterMatch) {
            const year = parseInt(winterMatch[1]);
            return year * 10 + 2; // Winter semester
        } else if (summerMatch) {
            const year = parseInt(summerMatch[1]);
            return year * 10 + 3; // Summer semester
        }
        
        return 0;
    }

    // Track what we've already sorted to prevent re-sorting the same content
    let sortedContent = new Set();
    let allTimersStopped = false;
    let lastDropdownContent = '';
    
    // Global flag for manual trigger
    window.vtopManualSortRequested = false;
    
    // Function to stop all timers
    function stopAllTimers() {
        if (allTimersStopped) return;
        
        debugLog('Stopping retry timers but keeping continuous monitoring');
        
        // Clear all retry timeouts
        if (window.retryTimeouts) {
            window.retryTimeouts.forEach(timeout => clearTimeout(timeout));
        }
        
        // Don't stop the continuous check - keep monitoring for changes
        // if (window.continuousCheck) {
        //     clearInterval(window.continuousCheck);
        // }
        
        // Don't disconnect observer - keep monitoring for DOM changes
        // if (window.courseObserver) {
        //     window.courseObserver.disconnect();
        // }
        
        debugLog('Retry timers stopped, continuous monitoring continues');
    }
    
    // Function to check if course sorting is enabled
    function isCourseSortEnabled(callback) {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['courseSort'], (result) => {
                    const enabled = result.courseSort !== false; // Default to true if not set
                    debugLog('Course sort enabled:', enabled);
                    callback(enabled);
                });
            } else {
                debugLog('Chrome storage not available, defaulting to enabled');
                callback(true);
            }
        } catch (e) {
            debugLog('Error checking course sort setting:', e);
            callback(true); // Default to enabled on error
        }
    }
    
    // Function to sort course elements by semester
    function sortCourseDropdown() {
        debugLog('Attempting to sort course dropdown...');
        
        // Check for manual trigger
        if (window.vtopManualSortRequested) {
            debugLog('Manual sort requested, clearing flag and resetting');
            window.vtopManualSortRequested = false;
            sortedContent.clear();
            allTimersStopped = false;
        }
        
        // Check if we're still in a valid context
        try {
            if (!document || !document.body) {
                debugLog('Document or body not available');
                return false;
            }
        } catch (e) {
            debugLog('Extension context invalidated');
            return false;
        }
        
        // Check if course sorting is enabled
        isCourseSortEnabled((enabled) => {
            if (!enabled) {
                debugLog('Course dropdown sorting is disabled');
                return false;
            }
            
            // Try different possible selectors for the course dropdown
            let courseSelect = document.getElementById('courseId');
            if (!courseSelect) {
                courseSelect = document.querySelector('select[name="courseId"]');
            }
            if (!courseSelect) {
                courseSelect = document.querySelector('select[data-semestr]');
            }
            
            debugLog('Course select found:', !!courseSelect);
            
            // If no dropdown found, try to find course list elements
            if (!courseSelect) {
                debugLog('No course dropdown found, looking for course elements...');
                
                // First, try to find elements that look like course items in a list
                // Look for elements containing semester text and course codes
                const allElements = document.querySelectorAll('*');
                const courseListElements = [];
                
                debugLog('Scanning all elements for course items...');
                
                allElements.forEach(element => {
                    const text = element.textContent || '';
                    // Look for elements that contain both semester info and course codes
                    if ((text.includes('Fall Semester') || text.includes('Winter Semester') || text.includes('Summer Semester')) &&
                        (text.includes(' - ') && (text.match(/[A-Z]{3}\d{4}/) || text.match(/[A-Z]{2,3}\d{4}/)))) {
                        courseListElements.push(element);
                        debugLog('Found course element:', text.substring(0, 100) + '...');
                    }
                });
                
                debugLog(`Found ${courseListElements.length} potential course list elements`);
                
                if (courseListElements.length > 0) {
                    const contentHash = Array.from(courseListElements).map(el => el.textContent).join('|');
                    if (!sortedContent.has(contentHash)) {
                        const success = sortCourseElementsByText(courseListElements);
                        if (success) {
                            sortedContent.add(contentHash);
                            debugLog('Successfully sorted course list elements');
                            return true;
                        }
                    } else {
                        debugLog('Content already sorted');
                    }
                    return false;
                }
                
                // Try a more specific approach - look for elements that are likely course items
                debugLog('Trying alternative detection methods...');
                
                // Look for elements with specific patterns
                const alternativeSelectors = [
                    'div[onclick*="selectCourse"]',
                    'div[onclick*="course"]',
                    'div[onclick*="register"]',
                    'div[onclick*="select"]',
                    'a[onclick*="course"]',
                    'a[onclick*="select"]',
                    'tr[onclick*="course"]',
                    'tr[onclick*="select"]',
                    '.course-row',
                    '.course-item',
                    '.registered-course',
                    '[class*="course"]',
                    '[class*="semester"]'
                ];
                
                let foundElements = [];
                alternativeSelectors.forEach(selector => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            debugLog(`Found ${elements.length} elements with selector: ${selector}`);
                            foundElements.push(...elements);
                        }
                    } catch (e) {
                        // Ignore invalid selectors
                    }
                });
                
                // Filter found elements to only include those with semester text
                const filteredElements = foundElements.filter(element => {
                    const text = element.textContent || '';
                    return text.includes('Fall Semester') || text.includes('Winter Semester') || text.includes('Summer Semester');
                });
                
                debugLog(`Filtered to ${filteredElements.length} elements with semester text`);
                
                if (filteredElements.length > 0) {
                    const contentHash = Array.from(filteredElements).map(el => el.textContent).join('|');
                    if (!sortedContent.has(contentHash)) {
                        const success = sortCourseElementsByText(filteredElements);
                        if (success) {
                            sortedContent.add(contentHash);
                            debugLog('Successfully sorted filtered course elements');
                            return true;
                        }
                    } else {
                        debugLog('Content already sorted');
                    }
                    return false;
                }
                
                // Try to find course list items or divs with semester data
                const courseElements = document.querySelectorAll('[data-semestr], .course-item, .registered-course');
                if (courseElements.length > 0) {
                    debugLog(`Found ${courseElements.length} course elements with data-semestr`);
                    const contentHash = Array.from(courseElements).map(el => el.textContent).join('|');
                    if (!sortedContent.has(contentHash)) {
                        const success = sortCourseElements(courseElements);
                        if (success) {
                            sortedContent.add(contentHash);
                            debugLog('Successfully sorted course elements');
                            return true;
                        }
                    } else {
                        debugLog('Content already sorted');
                    }
                    return false;
                }
                
                debugLog('No course elements found with any method');
                return false;
            }

            // Found the dropdown - sort its options
            debugLog('Found course dropdown, sorting options...');
            
            // Get all options except the first one (which is usually "Select Course")
            const options = Array.from(courseSelect.options).slice(1);
            
            if (options.length === 0) {
                debugLog('No options found in dropdown');
                return false;
            }
            
            // Check if content has changed
            const currentContent = options.map(option => option.textContent).join('|');
            if (currentContent === lastDropdownContent && !window.vtopManualSortRequested) {
                debugLog('Dropdown content unchanged, skipping sort');
                return false;
            }
            
            debugLog(`Found ${options.length} options to sort`);
            debugLog('Content changed, re-sorting dropdown');
            
            // Sort options based on semester code
            options.sort((a, b) => {
                const semesterA = a.getAttribute('data-semestr');
                const semesterB = b.getAttribute('data-semestr');
                
                if (!semesterA || !semesterB) return 0;
                
                const valueA = parseSemesterCode(semesterA);
                const valueB = parseSemesterCode(semesterB);
                
                // Sort in descending order (most recent first)
                return valueB - valueA;
            });

            // Clear existing options (except the first one)
            const firstOption = courseSelect.options[0];
            courseSelect.innerHTML = '';
            courseSelect.appendChild(firstOption);

            // Add sorted options back
            options.forEach(option => {
                courseSelect.appendChild(option);
            });

            lastDropdownContent = currentContent;
            debugLog('Successfully sorted dropdown options');
            return true;
        });
        
        return false;
    }

    // Function to initialize the course page functionality
    function initCoursePage() {
        debugLog('Initializing course page functionality...');
        
        // Wait for the DOM to be ready
        if (document.readyState === 'loading') {
            debugLog('DOM still loading, waiting for DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', () => {
                debugLog('DOMContentLoaded fired');
                setTimeout(() => sortCourseDropdown(), 100);
            });
        } else {
            debugLog('DOM already ready, sorting immediately');
            // DOM is already ready
            setTimeout(() => sortCourseDropdown(), 100);
        }
        
        // Retry strategy with longer intervals
        const retryIntervals = [1000, 3000, 6000, 12000];
        window.retryTimeouts = [];
        
        retryIntervals.forEach((delay, index) => {
            const timeout = setTimeout(() => {
                debugLog(`Retry attempt ${index + 1} after ${delay}ms`);
                sortCourseDropdown();
            }, delay);
            window.retryTimeouts.push(timeout);
        });
        
        // Continuous monitoring for new content (less frequent)
        let checkCount = 0;
        const maxChecks = 50; // Increased to 50 checks for longer monitoring
        
        window.continuousCheck = setInterval(() => {
            checkCount++;
            debugLog(`Continuous check ${checkCount}/${maxChecks}`);
            
            // Check for manual trigger
            if (window.vtopManualSortRequested) {
                debugLog('Manual sort detected in continuous check');
                window.vtopManualSortRequested = false;
                sortedContent.clear();
                allTimersStopped = false;
            }
            
            const success = sortCourseDropdown();
            
            // Don't stop on success - keep monitoring for changes
            if (checkCount >= maxChecks) {
                clearInterval(window.continuousCheck);
                debugLog('Continuous check reached max count, but observer continues');
            }
        }, 2000); // Check every 2 seconds for more responsive monitoring

        // Also sort when the page content changes (for dynamic loading)
        window.courseObserver = new MutationObserver((mutations) => {
            let shouldSort = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if any new nodes contain course-related content
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const text = node.textContent || '';
                            if (text.includes('Fall Semester') || text.includes('Winter Semester') || 
                                text.includes('Summer Semester') || text.includes('courseId') ||
                                text.includes('Select Course') || text.includes('Select Registered Course')) {
                                shouldSort = true;
                            }
                        }
                    });
                    
                    // Also check if the target element is a select or contains course-related content
                    if (mutation.target.nodeType === Node.ELEMENT_NODE) {
                        const targetText = mutation.target.textContent || '';
                        const targetId = mutation.target.id || '';
                        const targetName = mutation.target.name || '';
                        
                        if (targetText.includes('Fall Semester') || targetText.includes('Winter Semester') || 
                            targetText.includes('Summer Semester') || targetId === 'courseId' ||
                            targetName === 'courseId' || targetText.includes('Select Course')) {
                            shouldSort = true;
                        }
                    }
                }
            });
            
            if (shouldSort) {
                debugLog('DOM mutation detected, triggering sort');
                setTimeout(() => sortCourseDropdown(), 100); // Shorter delay for more responsive sorting
            }
        });

        // Start observing with more aggressive settings
        window.courseObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['innerHTML', 'textContent']
        });
        
        debugLog('Course page functionality initialized');
    }

    // Initialize when the script loads
    debugLog('Course page script loaded');
    initCoursePage();
    
    // Expose manual trigger function for debugging
    // Use a different approach that doesn't violate CSP
    try {
        // Try to inject via chrome.scripting if available
        if (typeof chrome !== 'undefined' && chrome.scripting) {
            chrome.scripting.executeScript({
                target: { tabId: chrome.tabs.TAB_ID_NONE },
                func: () => {
                    window.manualSortCourses = function() {
                        console.log('[VTOP Course Sort] Manual sort triggered from page context');
                        document.dispatchEvent(new CustomEvent('manualSortCourses'));
                    };
                    console.log('[VTOP Course Sort] manualSortCourses function injected via chrome.scripting');
                }
            });
        } else {
            // Fallback: just log that manual sort is available
            debugLog('Manual sort available via window.manualSortCourses (if injected)');
        }
    } catch (e) {
        debugLog('Could not inject manual sort function:', e);
    }
    
    // Listen for the manual sort event
    document.addEventListener('manualSortCourses', () => {
        debugLog('Manual sort triggered via event');
        sortedContent.clear(); // Clear the tracked content
        allTimersStopped = false; // Reset the stopped state
        sortCourseDropdown();
    });
    
    // Also trigger on window load event
    window.addEventListener('load', () => {
        debugLog('Window load event fired');
        setTimeout(() => sortCourseDropdown(), 1000);
    });

})();

