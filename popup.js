// 扩展弹窗脚本 - 支持Gemini API功能

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
  const apiKey = document.getElementById('apiKey');
  const modelSelect = document.getElementById('modelSelect');
  
  summaryLength.addEventListener('change', saveSettings);
  summaryLanguage.addEventListener('change', saveSettings);
  modelSelect.addEventListener('change', saveSettings);
  
  // 当 API Key 变化时，自动加载可用模型
  apiKey.addEventListener('change', async () => {
    saveSettings();
    await loadAvailableModels();
  });
});

// 加载可用的模型列表
async function loadAvailableModels() {
  const apiKey = document.getElementById('apiKey').value;
  const modelSelect = document.getElementById('modelSelect');
  
  if (!apiKey) {
    modelSelect.innerHTML = '<option value="">请先输入 API Key</option>';
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('获取模型列表失败:', errorData);
      modelSelect.innerHTML = '<option value="">获取模型列表失败</option>';
      return;
    }
    
    const data = await response.json();
    
    if (!data.models) {
      modelSelect.innerHTML = '<option value="">没有可用模型</option>';
      return;
    }
    
    // 筛选支持 generateContent 的模型
    const supportedModels = data.models.filter(model => 
      model.supportedGenerationMethods && 
      model.supportedGenerationMethods.includes('generateContent')
    );
    
    if (supportedModels.length === 0) {
      modelSelect.innerHTML = '<option value="">没有支持 generateContent 的模型</option>';
      return;
    }
    
    // 清空现有选项
    modelSelect.innerHTML = '';
    
    // 添加模型选项
    supportedModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model.name;
      option.textContent = model.displayName || model.name;
      modelSelect.appendChild(option);
    });
    
    // 尝试恢复之前选择的模型
    const savedSettings = await chrome.storage.local.get(['selectedModel']);
    if (savedSettings.selectedModel) {
      const matchingOption = Array.from(modelSelect.options).find(opt => opt.value === savedSettings.selectedModel);
      if (matchingOption) {
        modelSelect.value = savedSettings.selectedModel;
      }
    }
    
  } catch (error) {
    console.error('加载模型列表失败:', error);
    modelSelect.innerHTML = '<option value="">加载失败</option>';
  }
}

// 使用Gemini API生成文章总结
async function generateGeminiSummary(content, settings) {
  const { apiKey, summaryLength = 'medium', summaryLanguage = 'zh-CN', selectedModel } = settings || {};
  
  if (!apiKey) {
    throw new Error('请先在设置中配置Gemini API Key');
  }
  
  if (!selectedModel) {
    throw new Error('请选择一个模型');
  }
  
  const lengthPrompts = {
    'short': '请用简短的语言（50-100字）总结以下文章的核心要点',
    'medium': '请用中等长度（100-200字）总结以下文章的主要内容',
    'long': '请用详细的语言（200-300字）总结以下文章的详细内容'
  };
  
  const prompt = `${lengthPrompts[summaryLength]}，使用${summaryLanguage === 'zh-CN' ? '中文' : '英文'}回答：\n\n${content}`;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API错误: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini API未返回结果');
    }
    
    const summary = data.candidates[0].content.parts[0].text.trim();
    
    if (!summary) {
      throw new Error('Gemini API返回空结果');
    }
    
    return summary;
  } catch (error) {
    console.error('Gemini API调用失败:', error);
    throw error;
  }
}

// 传统总结方法（备用方案）
function generateTraditionalSummary(content, settings) {
  const { summaryLength = 'medium' } = settings || {};
  
  const lengthMap = {
    'short': 2,
    'medium': 4,
    'long': 6
  };
  
  const sentenceCount = lengthMap[summaryLength] || 4;
  const sentences = content.split(/[.!?。！？]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length === 0) {
    return '内容过短，无法生成有效总结';
  }
  
  const summarySentences = sentences.slice(0, sentenceCount);
  return summarySentences.join('. ') + '.';
}

// 加载设置
function loadSettings() {
  chrome.storage.local.get(['summaryLength', 'summaryLanguage', 'apiKey', 'selectedModel'], async (result) => {
    if (result.summaryLength) {
      document.getElementById('summaryLength').value = result.summaryLength;
    }
    if (result.summaryLanguage) {
      document.getElementById('summaryLanguage').value = result.summaryLanguage;
    }
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
      // 如果有 API Key，加载可用模型
      await loadAvailableModels();
    }
  });
}

// 保存设置
function saveSettings() {
  const summaryLength = document.getElementById('summaryLength').value;
  const summaryLanguage = document.getElementById('summaryLanguage').value;
  const apiKey = document.getElementById('apiKey').value;
  const selectedModel = document.getElementById('modelSelect').value;
  
  chrome.storage.local.set({
    summaryLength: summaryLength,
    summaryLanguage: summaryLanguage,
    apiKey: apiKey,
    selectedModel: selectedModel
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
    
    // 使用 scripting API 注入脚本提取网页内容
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageContent
    });
    
    const content = injectionResults[0]?.result;
    
    if (content) {
      // 获取当前设置
      const settings = await chrome.storage.local.get(['summaryLength', 'summaryLanguage', 'apiKey', 'selectedModel']);
      
      try {
        // 直接调用Gemini API生成总结
        const summary = await generateGeminiSummary(content, settings);
        summaryResult.innerHTML = summary;
      } catch (error) {
        console.error('Gemini API总结失败:', error);
        // 使用备用总结方法
        const fallbackSummary = generateTraditionalSummary(content, settings);
        summaryResult.innerHTML = `<div class="error">${error.message}</div><br/>${fallbackSummary}`;
      }
    } else {
      summaryResult.innerHTML = '<div class="error">无法获取网页内容，请重试</div>';
    }
  } catch (error) {
    console.error('总结失败:', error);
    summaryResult.innerHTML = `<div class="error">总结失败: ${error.message}</div>`;
  } finally {
    // 隐藏加载状态
    summaryBtn.disabled = false;
    loading.style.display = 'none';
  }
}

// 提取文章内容
function extractPageContent() {
  let mainContent = '';
  
  // 尝试使用常见的文章容器选择器
  const articleSelectors = [
    'article',
    '.article',
    '.post',
    '.content',
    '.main-content',
    '#main-content',
    '.entry-content',
    '.post-content',
    '#page-content',
    '.article-content',
    '.story-content',
    '.text-content'
  ];
  
  for (const selector of articleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      mainContent = element.textContent.trim();
      if (mainContent.length > 200) {
        break;
      }
    }
  }
  
  return mainContent || '无法提取到有效的内容';
}
