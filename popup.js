// 扩展弹窗脚本 - 支持Gemini API功能

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 加载保存的设置
  loadSettings();
  
  // 初始化复制按钮为禁用状态
  const copyBtn = document.getElementById('copyBtn');
  copyBtn.disabled = true;
  
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
  const sourceRadios = document.querySelectorAll('input[name="source"]');
  
  summaryLength.addEventListener('change', saveSettings);
  summaryLanguage.addEventListener('change', saveSettings);
  modelSelect.addEventListener('change', saveSettings);
  
  // 绑定来源选择事件
  sourceRadios.forEach(radio => {
    radio.addEventListener('change', saveSettings);
  });
  
  // 绑定复制按钮事件
  copyBtn.addEventListener('click', copySummary);
  
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
    const supportedModels = data.models
      .filter(model =>
        model.displayName.includes('Gemini') &&
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      )
      .sort((a, b) => (a.displayName).localeCompare(b.displayName));
    
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
      option.textContent = model.displayName;
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
  chrome.storage.local.get(['summaryLength', 'summaryLanguage', 'apiKey', 'selectedModel', 'selectedSource'], async (result) => {
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
    if (result.selectedSource) {
      const sourceRadio = document.querySelector(`input[name="source"][value="${result.selectedSource}"]`);
      if (sourceRadio) {
        sourceRadio.checked = true;
      }
    }
  });
}

// 保存设置
function saveSettings() {
  const summaryLength = document.getElementById('summaryLength').value;
  const summaryLanguage = document.getElementById('summaryLanguage').value;
  const apiKey = document.getElementById('apiKey').value;
  const selectedModel = document.getElementById('modelSelect').value;
  const selectedSource = document.querySelector('input[name="source"]:checked')?.value || '一群';
  
  chrome.storage.local.set({
    summaryLength: summaryLength,
    summaryLanguage: summaryLanguage,
    apiKey: apiKey,
    selectedModel: selectedModel,
    selectedSource: selectedSource
  });
}

// 总结文章
async function summarizeArticle() {
  const summaryBtn = document.getElementById('summaryBtn');
  const loading = document.getElementById('loading');
  const summaryTextarea = document.getElementById('summaryTextarea');
  const copyBtn = document.getElementById('copyBtn');
  
  // 显示加载状态
  summaryBtn.disabled = true;
  loading.style.display = 'block';
  summaryTextarea.value = '';
  copyBtn.disabled = true;
  
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
      const settings = await chrome.storage.local.get(['summaryLength', 'summaryLanguage', 'apiKey', 'selectedModel', 'selectedSource']);
      
      try {
        // 直接调用Gemini API生成总结
        const summary = await generateGeminiSummary(content, settings);
        
        // 获取模型显示名称
        const modelSelect = document.getElementById('modelSelect');
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        const modelName = selectedOption ? selectedOption.textContent : settings.selectedModel;
        
        // 格式化输出结果
        const formattedSummary = formatSummary(summary, tab.title, tab.url, settings.selectedSource || '一群', modelName);
        summaryTextarea.value = formattedSummary;
        copyBtn.disabled = false;
      } catch (error) {
        console.error('Gemini API总结失败:', error);
        // 使用备用总结方法
        const fallbackSummary = generateTraditionalSummary(content, settings);
        const formattedSummary = formatSummary(fallbackSummary, tab.title, tab.url, settings.selectedSource || '一群', '');
        summaryTextarea.value = `${error.message}\n\n${formattedSummary}`;
        copyBtn.disabled = false;
      }
    } else {
      summaryTextarea.value = '无法获取网页内容，请重试';
    }
  } catch (error) {
    console.error('总结失败:', error);
    summaryTextarea.value = `总结失败: ${error.message}`;
  } finally {
    // 隐藏加载状态
    summaryBtn.disabled = false;
    loading.style.display = 'none';
  }
}

// 格式化总结输出
function formatSummary(summary, title, url, source, modelName) {
  const modelInfo = modelName ? `[使用 ${modelName} 总结]` : '';
  return `🔊 转发 ${source} 成员的原创技术文章

${title}
${url}

${summary}

${modelInfo}`;
}

// 复制总结内容
async function copySummary() {
  const summaryTextarea = document.getElementById('summaryTextarea');
  const copyBtn = document.getElementById('copyBtn');
  
  try {
    await navigator.clipboard.writeText(summaryTextarea.value);
    
    // 显示复制成功提示
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '复制成功！';
    copyBtn.style.backgroundColor = '#137333';
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.backgroundColor = '#34a853';
    }, 2000);
  } catch (error) {
    console.error('复制失败:', error);
    alert('复制失败，请手动复制');
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
