// 扩展后台脚本

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('GDG西安文章总结助手已安装');
  
  // 初始化存储数据
  chrome.storage.local.set({
    summaryLength: 'medium', // 默认总结长度：中等
    summaryLanguage: 'zh-CN' // 默认总结语言：中文
  });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSummary') {
    // 这里可以添加调用AI API进行文章总结的逻辑
    // 目前只是模拟总结功能
    const summary = generateMockSummary(message.content);
    sendResponse({ summary: summary });
  }
  return true;
});

// 模拟文章总结功能
function generateMockSummary(content) {
  // 简单的模拟总结，实际项目中可以替换为AI API调用
  const sentences = content.split('. ');
  const summarySentences = sentences.slice(0, 3); // 取前3句话作为总结
  return summarySentences.join('. ') + '.';
}
