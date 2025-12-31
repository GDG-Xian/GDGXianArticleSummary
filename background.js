chrome.action.onClicked.addListener(async (tab) => {
  const existingWindows = await chrome.windows.getAll({
    windowTypes: ['popup'],
    populate: true
  });

  const existingPopup = existingWindows.find(w => 
    w.tabs && w.tabs.some(t => t.url && t.url.includes('popup.html'))
  );

  if (existingPopup) {
    await chrome.windows.update(existingPopup.id, { focused: true });
  } else {
    await chrome.windows.create({
      url: 'popup.html',
      type: 'popup',
      width: 800,
      height: 600,
      focused: true
    });
  }
});
