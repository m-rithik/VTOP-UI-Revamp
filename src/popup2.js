const defaultSettings = {
  extensionEnabled: true,
  dock: true,
  topBar: true,
  spotlight: true,
  loading: true,
  darkMode: true,
  pdfOpen: true,
  courseSort: true,
};

function Popup() {
  const [settings, setSettings] = React.useState(defaultSettings);
  const [loading, setLoading] = React.useState(true);

  // Load settings from chrome.storage.local on mount
  React.useEffect(() => {
    if (chrome?.storage) {
      chrome.storage.local.get(defaultSettings, (result) => {
        setSettings(result);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Only update storage when a toggle is changed
  const handleToggle = (key) => {
    let newSettings;
    if (key === 'dockTopBar') {
      const newValue = !(settings.dock && settings.topBar);
      newSettings = { ...settings, dock: newValue, topBar: newValue };
    } else if (key === 'tools') {
      const newValue = !(settings.pdfOpen && settings.darkMode);
      newSettings = { ...settings, pdfOpen: newValue, darkMode: newValue };
    } else {
      newSettings = { ...settings, [key]: !settings[key] };
    }
    setSettings(newSettings);
    if (chrome?.storage) {
      chrome.storage.local.set(newSettings);
    }
    // Refresh the VTOP page, not the popup
    if (chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]?.id) chrome.tabs.reload(tabs[0].id);
      });
    }
  };

  if (loading) {
    return React.createElement('div', { style: { width: 350, padding: 20, textAlign: 'center' } }, 'Loading...');
  }

  return (
    React.createElement('div', { style: { width: 350, padding: 20, background: '#e3f0fa', borderRadius: 16 } },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 16 } },
        React.createElement('img', { src: 'logo.png', alt: 'Logo', style: { width: 60 } }),
        React.createElement('h2', { style: { margin: 0 } }, 'VTOP UI Revamp')
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', margin: '8px 0', fontWeight: 'bold', color: '#1a237e' } },
        React.createElement('label', { style: { flex: 1 } }, 'Extension On/Off'),
        React.createElement('input', {
          type: 'checkbox',
          checked: settings.extensionEnabled,
          onChange: () => handleToggle('extensionEnabled')
        })
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', margin: '8px 0' } },
        React.createElement('label', { style: { flex: 1, color: settings.extensionEnabled ? undefined : '#aaa' } }, 'Dock & TopBar'),
          React.createElement('input', {
            type: 'checkbox',
          checked: settings.dock && settings.topBar,
          onChange: () => handleToggle('dockTopBar'),
          disabled: !settings.extensionEnabled
          })
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', margin: '8px 0' } },
        React.createElement('label', { style: { flex: 1, textTransform: 'capitalize', color: settings.extensionEnabled ? undefined : '#aaa' } }, 'Spotlight'),
        React.createElement('input', {
          type: 'checkbox',
          checked: settings.spotlight,
          onChange: () => handleToggle('spotlight'),
          disabled: !settings.extensionEnabled
        })
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', margin: '8px 0' } },
        React.createElement('label', { style: { flex: 1, textTransform: 'capitalize', color: settings.extensionEnabled ? undefined : '#aaa' } }, 'Loading'),
        React.createElement('input', {
          type: 'checkbox',
          checked: settings.loading,
          onChange: () => handleToggle('loading'),
          disabled: !settings.extensionEnabled
        })
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', margin: '8px 0' } },
        React.createElement('label', { style: { flex: 1, textTransform: 'capitalize', color: settings.extensionEnabled ? undefined : '#aaa' } }, 'Course Dropdown Sort'),
        React.createElement('input', {
          type: 'checkbox',
          checked: settings.courseSort,
          onChange: () => handleToggle('courseSort'),
          disabled: !settings.extensionEnabled
        })
      ),
      React.createElement('div', { style: { margin: '12px 0 0 0', fontWeight: 'bold' } }, 'Tools'),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', margin: '8px 0' } },
        React.createElement('label', { style: { flex: 1, color: settings.extensionEnabled ? undefined : '#aaa' } }, 'Enable PDF View Only & Dark Mode'),
        React.createElement('input', {
          type: 'checkbox',
          checked: settings.pdfOpen && settings.darkMode,
          onChange: () => handleToggle('tools'),
          disabled: !settings.extensionEnabled
        })
      ),
      React.createElement('div', { style: { marginTop: 20, paddingTop: 16, borderTop: '1px solid #d1e6f7' } },
        React.createElement('div', { 
          style: { 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
            color: '#24292e'
          },
          onClick: () => {
            chrome.tabs.create({ url: 'https://github.com/m-rithik/VTOP-UI-Revamp' });
          },
          onMouseEnter: (e) => {
            e.target.style.backgroundColor = '#f1f3f4';
            e.target.style.transform = 'translateY(-1px)';
          },
          onMouseLeave: (e) => {
            e.target.style.backgroundColor = '#f8f9fa';
            e.target.style.transform = 'translateY(0)';
          }
        },
          React.createElement('svg', { 
            width: 16, 
            height: 16, 
            viewBox: '0 0 24 24', 
            fill: 'currentColor',
            style: { flexShrink: 0 }
          }, 
            React.createElement('path', { 
              d: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'
            })
          ),
          React.createElement('span', { style: { fontWeight: 500, fontSize: 14 } }, 'Contribute')
        )
      )
    )
  );
}

ReactDOM.render(
  React.createElement(Popup),
  document.getElementById('root')
); 