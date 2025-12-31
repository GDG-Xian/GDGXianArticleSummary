// 扩展弹窗脚本

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 加载保存的设置
  loadSettings();
  
  // 绑定总结按钮点击事件
  const summaryBtn = document.getElementById('summaryBtn');
  summaryBtn.addEventListener('click', () => {
    summarizeArticle();
  });
  
  // 绑定设置变化事件
  const summaryLength = document.getElementById('summaryLength');
  const summaryLanguage = document.getElementById('summaryLanguage');
  
  summaryLength.addEventListener('change', saveSettings);
  summaryLanguage.addEventListener('change', saveSettings);
});

// 加载设置
function loadSettings() {
  chrome.storage.local.get(['summaryLength', 'summaryLanguage'], (result) => {
    if (result.summaryLength) {
      document.getElementById('summaryLength').value = result.summaryLength;
    }
    if (result.summaryLanguage) {
      document.getElementById('summaryLanguage').value = result.summaryLanguage;
    }
  });
}

// 保存设置
function saveSettings() {
  const summaryLength = document.getElementById('summaryLength').value;
  const summaryLanguage = document.getElementById('summaryLanguage').value;
  
  chrome.storage.local.set({
    summaryLength: summaryLength,
    summaryLanguage: summaryLanguage
  });
}

// 总结文章
async function summarizeArticle() {
  const summaryBtn = document.getElementById('summaryBtn');
  const loading = document.getElementById('loading');
  const summaryResult = document.getElementById('summaryResult');
  
  // 显示加载状态
  summaryBtn.disabled = true;
  loading.style.display = 'block';
  summaryResult.innerHTML = '';
  
  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 向content script发送消息，获取网页内容
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
    
    if (response && response.content) {
      // 获取当前设置
      const settings = await chrome.storage.local.get(['summaryLength', 'summaryLanguage']);
      
      // 向background script发送消息，请求总结
      chrome.runtime.sendMessage(
        { 
          action: 'getSummary', 
          content: response.content,
          settings: settings
        },
        (result) => {
          if (result && result.summary) {
            summaryResult.innerHTML = result.summary;
          } else {
            summaryResult.innerHTML = '<div class="error">总结失败，请重试</div>';
          }
          
          // 隐藏加载状态
          summaryBtn.disabled = false;
          loading.style.display = 'none';
        }
      );
    } else {
      summaryResult.innerHTML = '<div class="error">无法获取网页内容，请重试</div>';
      summaryBtn.disabled = false;
      loading.style.display = 'none';
    }
  } catch (error) {
    console.error('总结失败:', error);
    summaryResult.innerHTML = `<div class="error">总结失败: ${error.message}</div>`;
    summaryBtn.disabled = false;
    loading.style.display = 'none';
  }
}
