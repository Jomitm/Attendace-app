// CRWI Attendance Extension Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
    console.log('CRWI Attendance Widget installed.');
});

// Optional: Handle side panel behavior
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
