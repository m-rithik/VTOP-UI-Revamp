chrome.alarms.create('activityAlarm', {
  periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'activityAlarm') {
      keepVTOPSessionAlive();
  }
});

function keepVTOPSessionAlive() {
  chrome.tabs.query({ url: 'https://vtop.vit.ac.in/vtop/content' }, (tabs) => {
      if (tabs.length > 0) {
          let tabId = tabs[0].id;
          chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: extractTokensAndSendRequest
          }, (results) => {
              if (chrome.runtime.lastError) {
                  console.error('Failed to execute script:', chrome.runtime.lastError.message);
              } else {
                  console.log('Request sent successfully:', results);
              }
          });
      } else {
          console.error('No active VTOP tab found. Please make sure you have a VTOP tab open.');
      }
  });
}

function extractTokensAndSendRequest() {
  const csrfInput = document.querySelector('input[name="_csrf"]');
  const authIDInput = document.querySelector('input[name="authorizedID"]');
  
  if (!csrfInput || !authIDInput) {
      console.error('CSRF token or authorizedID not found on the page.');
      return;
  }

  const csrfToken = csrfInput.value;
  const authorizedID = authIDInput.value;
  
  const payload = new URLSearchParams();
  payload.append('_csrf', csrfToken);
  payload.append('authorizedID', authorizedID);
  payload.append('x', new Date().toUTCString());

  fetch('https://vtop.vit.ac.in/vtop/home', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Origin': 'https://vtop.vit.ac.in',
          'Pragma': 'no-cache',
          'Referer': 'https://vtop.vit.ac.in/vtop/content',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': navigator.userAgent,
          'X-Requested-With': 'XMLHttpRequest'
      },
      body: payload.toString(),
      credentials: 'include' 
  })
  .then(response => {
      if (response.ok) {
          console.log('Activity request sent successfully.');
      } else {
          console.error('Failed to send activity request:', response.statusText);
      }
  })
  .catch(error => {
      console.error('Error sending activity request:', error);
  });
}
// Background script for VTOP PDF
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type !== "open-pdf" || !msg.dataUrl) return;
  chrome.tabs.create({ url: msg.dataUrl });
}); 

