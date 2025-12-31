// 扩展内容脚本，用于提取网页内容

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageContent') {
    // 提取网页内容
    const content = extractPageContent();
    sendResponse({ content: content });
  }
  return true;
});

// 提取网页内容
function extractPageContent() {
  // 尝试多种方式提取主要内容
  let mainContent = '';
  
  // 1. 尝试使用常见的文章容器选择器
  const articleSelectors = [
    'article',
    '.article',
    '.post',
    '.content',
    '.main-content',
    '#main-content',
    '.entry-content',
    '.post-content',
    '.article-content'
  ];
  
  for (const selector of articleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      mainContent = element.textContent.trim();
      if (mainContent.length > 100) {
        break;
      }
    }
  }
  
  // 2. 如果没有找到合适的容器，尝试提取body文本（排除script和style标签）
  if (!mainContent || mainContent.length < 100) {
    const body = document.body;
    const clonedBody = body.cloneNode(true);
    
    // 移除script和style标签
    const scripts = clonedBody.querySelectorAll('script, style, noscript, iframe, canvas, svg');
    scripts.forEach(script => script.remove());
    
    mainContent = clonedBody.textContent.trim();
  }
  
  // 3. 如果内容还是太少，尝试提取标题和段落
  if (mainContent.length < 100) {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const paragraphs = document.querySelectorAll('p');
    
    const contentParts = [];
    
    // 提取标题
    headings.forEach(heading => {
      contentParts.push(heading.textContent.trim());
    });
    
    // 提取段落
    paragraphs.forEach(paragraph => {
      const text = paragraph.textContent.trim();
      if (text.length > 50) {
        contentParts.push(text);
      }
    });
    
    mainContent = contentParts.join('\n\n');
  }
  
  // 清理内容
  mainContent = cleanContent(mainContent);
  
  return mainContent;
}

// 清理内容
function cleanContent(content) {
  // 移除多余的空白字符
  content = content.replace(/\s+/g, ' ').trim();
  
  // 移除连续的标点符号
  content = content.replace(/[.,!?;:]{2,}/g, match => match[0]);
  
  return content;
}
