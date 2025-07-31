(function() {
  /* ---------- 1. STYLE (unchanged) ---------- */
  const style = document.createElement('style');
  style.textContent = `
    #sidePanel, .btnBarColor, .navbar-toggler, .navbar-toggler-icon, [data-bs-toggle="offcanvas"] {
      display: none !important;
    }
    #vtop-dock {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      background: rgba(255,255,255,0.85);
      border-radius: 24px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      padding: 10px 18px;
      gap: 14px;
      min-height: 56px;
      transition: opacity 0.18s cubic-bezier(.4,0,.2,1), bottom 0.18s cubic-bezier(.4,0,.2,1);
      opacity: 0;
      pointer-events: none;
    }
    #vtop-dock.vtop-dock-visible {
      opacity: 1;
      pointer-events: auto;
      bottom: 32px;
    }
    .vtop-dock-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      transition: transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s cubic-bezier(.4,0,.2,1);
      position: relative;
    }
    .vtop-dock-icon:hover {
      transform: scale(1.18);
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      background: rgba(0,0,0,0.04);
    }
    .vtop-dock-search {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      transition: transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s cubic-bezier(.4,0,.2,1);
      position: relative;
      color: #000;
    }
    .vtop-dock-search:hover {
      transform: scale(1.18);
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      background: rgba(0,0,0,0.04);
    }
    .vtop-dock-search.active {
      background: rgba(0,0,0,0.04);
      color: #000;
    }
    .vtop-dock-dropdown {
      position: absolute;
      bottom: 56px;
      left: 50%;
      transform: translateX(-50%) scale(0.98);
      min-width: 240px;
      max-height: 340px;
      overflow-y: auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      padding: 10px 0;
      z-index: 10000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.12s cubic-bezier(.4,0,.2,1), transform 0.12s cubic-bezier(.4,0,.2,1);
      scrollbar-width: thin;
      visibility: hidden;
    }
    .vtop-dock-dropdown.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(-50%) scale(1);
      visibility: visible;
    }
    .vtop-dock-search-dropdown {
      min-width: 320px;
      max-width: 400px;
    }
    .vtop-dock-search-input {
      width: 100%;
      padding: 12px 16px;
      border: none;
      border-bottom: 1px solid #e0e0e0;
      font-size: 14px;
      outline: none;
      background: transparent;
      color: #333;
    }
    .vtop-dock-search-input::placeholder {
      color: #999;
    }
    .vtop-dock-dropdown .dock-section-title {
      font-weight: bold;
      font-size: 1rem;
      padding: 6px 18px 4px 18px;
      color: #1a237e;
    }
    .vtop-dock-dropdown .dock-link, .vtop-dock-dropdown .dock-subsection {
      display: block;
      padding: 7px 22px;
      color: #222;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.98rem;
      cursor: pointer;
      transition: background 0.13s cubic-bezier(.4,0,.2,1);
      white-space: nowrap;
    }
    .vtop-dock-dropdown .dock-link:hover, .vtop-dock-dropdown .dock-subsection:hover {
      background: #e3e8fd;
      color: #1a237e;
    }
    .vtop-dock-dropdown .dock-subsection {
      font-weight: 500;
      margin-top: 4px;
      margin-bottom: 2px;
      background: #f5f7fa;
      color: #3949ab;
    }
    .vtop-dock-dropdown .dock-nested {
      margin-left: 12px;
      border-left: 2px solid #e3e8fd;
      padding-left: 8px;
    }
    .vtop-dock-dropdown .dock-search-result {
      padding: 8px 18px;
      color: #666;
      font-size: 0.9rem;
      font-style: italic;
    }
    .vtop-dock-dropdown .dock-search-highlight {
      background: #fff3cd;
      padding: 1px 2px;
      border-radius: 2px;
    }
    #vtop-dock::-webkit-scrollbar, .vtop-dock-dropdown::-webkit-scrollbar {
      width: 6px;
      background: #e3e8fd;
    }
    #vtop-dock::-webkit-scrollbar-thumb, .vtop-dock-dropdown::-webkit-scrollbar-thumb {
      background: #b3baf7;
      border-radius: 8px;
    }
    #vtop-dock-hover-area {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: 80px;
      z-index: 9998;
      pointer-events: auto;
    }
  `;
  document.head.appendChild(style);

  /* ---------- 2. UTILITIES ---------- */
  const buildDataText = () => {
    const id   = document.getElementById('authorizedIDX')?.value ?? '';
    const csrf = window.csrfValue
              || document.querySelector('input[name="_csrf"]')?.value
              || '';
    return `verifyMenu=true&authorizedID=${encodeURIComponent(id)}&_csrf=${encodeURIComponent(csrf)}&nocache=${Date.now()}`;
  };

  const ajaxRouter = (url, ajax) => {
    const data = buildDataText();
    if (ajax === 'B5') {
      window.ajaxB5Call?.(url, data) || alert('ajaxB5Call not found!');
    } else {
      window.ajaxCall?.(url, data)   || alert('ajaxCall not found!');
    }
  };

  /* ---------- 3. DYNAMIC MENU SCAN ----------
     #sidePanel has Bootstrap dropdown structure:
       <div class="btn-group dropend">
         <button><i class="fa fa-icon"></i></button>
         <div class="dropdown-menu">
           <div class="fw-bold h6">Section Title</div>
           <a data-url="..." class="dropdown-item systemB5BtnMenu">Item</a>
           <div class="accordion">...</div>
         </div>
       </div>
  ------------------------------------------------*/
  function scanSidebar() {
    const root = document.querySelector('#sidePanel');
    if (!root) return [];

    const dig = (container) => {
      const items = [];
      
      // Handle direct dropdown items
      container.querySelectorAll(':scope > a.dropdown-item').forEach(a => {
        const label = a.textContent.trim().replace(/^\s*[•\s]+\s*/, ''); // Remove leading dots/spaces
        const url = a.dataset.url || '';
        const ajax = a.classList.contains('systemB5BtnMenu') ? 'B5' : 'Main';
        
        if (label && url) {
          items.push({ label, url, ajax });
        }
      });

      // Handle accordion sections
      container.querySelectorAll(':scope > .accordion').forEach(accordion => {
        accordion.querySelectorAll('.accordion-item').forEach(item => {
          const header = item.querySelector('.accordion-button');
          const body = item.querySelector('.accordion-body');
          
          if (header && body) {
            const sectionTitle = header.querySelector('span')?.textContent.trim() || 
                               header.textContent.trim().replace(/^\s*[•\s]+\s*/, '');
            
            if (sectionTitle) {
              const children = dig(body);
              if (children.length > 0) {
                items.push({ label: sectionTitle, children });
              }
            }
          }
        });
      });

      return items;
    };

    const menuData = [];
    
    // Scan each btn-group (main sections)
    root.querySelectorAll('.btn-group.dropend').forEach(btnGroup => {
      const button = btnGroup.querySelector('button');
      const dropdown = btnGroup.querySelector('.dropdown-menu');
      
      if (button && dropdown) {
        const icon = button.querySelector('i.fa')?.classList[1] || 'fa-circle';
        const sectionTitle = dropdown.querySelector('.fw-bold.h6')?.textContent.trim();
        
        if (sectionTitle) {
          const children = dig(dropdown);
          if (children.length > 0) {
            menuData.push({ icon, label: sectionTitle, children });
          }
        } else {
          // Single item without section title
          const children = dig(dropdown);
          if (children.length === 1) {
            menuData.push({ icon, label: children[0].label, url: children[0].url, ajax: children[0].ajax });
          } else if (children.length > 1) {
            menuData.push({ icon, label: 'Menu', children });
          }
        }
      }
    });

    return menuData;
  }

  /* ---------- 4. SEARCH FUNCTIONALITY ---------- */
  function flattenMenuItems(menuData, parentPath = '') {
    const flatItems = [];
    
    menuData.forEach(item => {
      const currentPath = parentPath ? `${parentPath} > ${item.label}` : item.label;
      
      if (item.children) {
        flatItems.push(...flattenMenuItems(item.children, currentPath));
      } else {
        flatItems.push({
          ...item,
          fullPath: currentPath,
          searchText: item.label.toLowerCase() // Only search the item label, not the full path
        });
      }
    });
    
    return flatItems;
  }

  function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="dock-search-highlight">$1</span>');
  }

  function renderSearchResults(searchQuery, allMenuItems) {
    if (!searchQuery.trim()) {
      return ''; // Return empty string when no search query
    }

    const query = searchQuery.toLowerCase();
    const results = allMenuItems.filter(item => {
      // Split the search query into multiple words
      const searchWords = query.split(/\s+/).filter(word => word.length > 0);
      
      // Split the menu item text into words
      const menuWords = item.searchText.split(/\s+/);
      
      // Check if all search words match the beginning of any menu word
      return searchWords.every(searchWord => 
        menuWords.some(menuWord => menuWord.startsWith(searchWord))
      );
    }).slice(0, 15); // Limit to 15 results

    if (results.length === 0) {
      return '<div class="dock-search-result">No items found</div>';
    }

    return results.map(item => {
      const highlightedLabel = highlightText(item.label, searchQuery);
      
      return `
        <a class="dock-link" href="javascript:void(0)" data-url="${item.url}" data-ajax="${item.ajax}">
          <div>${highlightedLabel}</div>
          <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">${item.fullPath}</div>
        </a>
      `;
    }).join('');
  }

  /* ---------- 5. RENDER DOCK ---------- */
  function renderDropdown(arr, parent) {
    arr.forEach(item => {
      if (item.children) {
        const hdr = Object.assign(document.createElement('div'), {
          className: 'dock-subsection', textContent: item.label,
        });
        parent.appendChild(hdr);

        const nest = Object.assign(document.createElement('div'), { className: 'dock-nested' });
        parent.appendChild(nest);
        renderDropdown(item.children, nest);
      } else {
        const link = Object.assign(document.createElement('a'), {
          className: 'dock-link',
          textContent: item.label,
          href: 'javascript:void(0)',
          onclick: e => { 
            e.preventDefault(); 
            ajaxRouter(item.url, item.ajax); 
            closeAll(); 
            // Hide the dock after menu navigation with same delay as hover
            setTimeout(() => {
              const dock = document.getElementById('vtop-dock');
              if (dock) {
                dock.classList.remove('vtop-dock-visible');
              }
            }, 1000);
          }
        });
        parent.appendChild(link);
      }
    });
  }

  function closeAll() {
    document.querySelectorAll('.vtop-dock-dropdown.open')
            .forEach(dd => dd.classList.remove('open'));
    document.querySelectorAll('.vtop-dock-search').forEach(search => 
      search.classList.remove('active')
    );
  }

  function initDock(menuData) {
    if (document.getElementById('vtop-dock')) return;       // already built

    const dock      = Object.assign(document.createElement('div'), { id: 'vtop-dock' });
    const hoverArea = document.getElementById('vtop-dock-hover-area')
                   || Object.assign(document.body.appendChild(document.createElement('div')), {
                        id: 'vtop-dock-hover-area'
                      });

    document.body.appendChild(dock);

    // Add search button first
    const searchBtn = Object.assign(document.createElement('div'), {
      className: 'vtop-dock-search',
      title: 'Search Menu',
      innerHTML: '<i class="fa fa-search"></i>'
    });
    dock.appendChild(searchBtn);

    const searchDropdown = Object.assign(document.createElement('div'), { 
      className: 'vtop-dock-dropdown vtop-dock-search-dropdown' 
    });
    searchBtn.appendChild(searchDropdown);

    // Add search input
    const searchInput = Object.assign(document.createElement('input'), {
      className: 'vtop-dock-search-input',
      placeholder: 'Search menu items...',
      type: 'text'
    });
    searchDropdown.appendChild(searchInput);

    const searchResults = Object.assign(document.createElement('div'), {
      className: 'vtop-dock-search-results'
    });
    searchDropdown.appendChild(searchResults);

    // Flatten all menu items for search
    const allMenuItems = flattenMenuItems(menuData);

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value;
        searchResults.innerHTML = renderSearchResults(query, allMenuItems);
      }, 150);
    });

    // Handle search result clicks
    searchResults.addEventListener('click', (e) => {
      const link = e.target.closest('.dock-link');
      if (link) {
        const url = link.dataset.url;
        const ajax = link.dataset.ajax;
        if (url) {
          ajaxRouter(url, ajax);
          closeAll();
          searchInput.value = '';
          searchResults.innerHTML = renderSearchResults('', allMenuItems);
          // Hide the dock after search navigation with same delay as hover
          setTimeout(() => {
            dock.classList.remove('vtop-dock-visible');
            visible = false;
          }, 1000);
        }
      }
    });

    /* build buttons + dropdowns */
    menuData.forEach(top => {
      const btn = Object.assign(document.createElement('div'), {
        className: 'vtop-dock-icon',
        title: top.label,
        innerHTML: `<i class="fa ${top.icon}"></i>`
      });
      dock.appendChild(btn);

      const dd  = Object.assign(document.createElement('div'), { className: 'vtop-dock-dropdown' });
      btn.appendChild(dd);

      if (top.children) {
        dd.appendChild(Object.assign(document.createElement('div'), {
          className: 'dock-section-title', textContent: top.label
        }));
        renderDropdown(top.children, dd);
      } else {
        dd.appendChild(Object.assign(document.createElement('a'), {
          className: 'dock-link',
          textContent: top.label,
          href: 'javascript:void(0)',
          onclick: e => { 
        e.preventDefault(); 
        ajaxRouter(top.url, top.ajax); 
        closeAll(); 
        // Hide the dock after menu navigation with same delay as hover
        setTimeout(() => {
          dock.classList.remove('vtop-dock-visible');
          visible = false;
        }, 1000);
      }
        }));
      }

      /* hover behaviour */
      let tID;
      const open  = () => { dd.classList.add('open'); };
      const close = () => { dd.classList.remove('open'); };

      btn.addEventListener('mouseenter', () => { 
        clearTimeout(tID); 
        // Only close other dropdowns, don't close all
        document.querySelectorAll('.vtop-dock-dropdown.open').forEach(otherDD => {
          if (otherDD !== dd) otherDD.classList.remove('open');
        });
        open(); 
      });
      btn.addEventListener('mouseleave', () => { tID = setTimeout(close, 150); });
      dd.addEventListener('mouseenter', () => { clearTimeout(tID); });
      dd.addEventListener('mouseleave', () => { tID = setTimeout(close, 150); });
    });

    // Search button hover behavior
    let searchTID;
    const openSearch = () => { 
      searchDropdown.classList.add('open'); 
      searchBtn.classList.add('active');
      searchInput.focus();
    };
    const closeSearch = () => { 
      searchDropdown.classList.remove('open'); 
      searchBtn.classList.remove('active');
    };

    searchBtn.addEventListener('mouseenter', () => { 
      clearTimeout(searchTID); 
      // Only close other dropdowns, don't close all
      document.querySelectorAll('.vtop-dock-dropdown.open').forEach(otherDD => {
        if (otherDD !== searchDropdown) otherDD.classList.remove('open');
      });
      openSearch(); 
    });
    searchBtn.addEventListener('mouseleave', () => { 
      searchTID = setTimeout(closeSearch, 150); 
    });
    searchDropdown.addEventListener('mouseenter', () => { 
      clearTimeout(searchTID); 
    });
    searchDropdown.addEventListener('mouseleave', () => { 
      searchTID = setTimeout(closeSearch, 150); 
    });

    /* dock show / hide on bottom hover */
    let visible = false;
    let hideTimeout;
    const show = () => { 
      clearTimeout(hideTimeout);
      if (!visible) { 
        dock.classList.add('vtop-dock-visible'); 
        visible = true; 
      } 
    };
    const hide = () => { 
      if (visible) { 
        hideTimeout = setTimeout(() => {
          dock.classList.remove('vtop-dock-visible'); 
          visible = false; 
        }, 1000); // 1 second delay
      } 
    };

    hoverArea.addEventListener('mouseenter', show);
    dock.addEventListener('mouseenter', show);
    hoverArea.addEventListener('mouseleave', hide);
    dock.addEventListener('mouseleave', hide);

    show(); setTimeout(hide, 1800);
  }

  /* ---------- 6. BOOTSTRAP WHEN PAGE AJAX IS READY ---------- */
  (function wait() {
    if (typeof window.ajaxCall === 'function' && typeof window.ajaxB5Call === 'function') {
      const sidebar = document.querySelector('#sidePanel');
      if (sidebar && sidebar.querySelectorAll('.btn-group.dropend').length > 0) {
        const menu = scanSidebar();
        if (menu.length) initDock(menu);
      } else {
        setTimeout(wait, 100);
      }
    } else {
      setTimeout(wait, 100);
    }
  })();
})();