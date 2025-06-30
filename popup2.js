const defaultSettings = {
  extensionEnabled: true,
  dock: true,
  topBar: true,
  spotlight: true,
  loading: true,
  darkMode: true,
  pdfOpen: true,
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
      React.createElement('div', { style: { margin: '12px 0 0 0', fontWeight: 'bold' } }, 'Tools'),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', margin: '8px 0' } },
        React.createElement('label', { style: { flex: 1, color: settings.extensionEnabled ? undefined : '#aaa' } }, 'Enable PDF View Only & Dark Mode'),
        React.createElement('input', {
          type: 'checkbox',
          checked: settings.pdfOpen && settings.darkMode,
          onChange: () => handleToggle('tools'),
          disabled: !settings.extensionEnabled
        })
      )
    )
  );
}

ReactDOM.render(
  React.createElement(Popup),
  document.getElementById('root')
); 