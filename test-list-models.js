// 测试 Gemini API ListModels 接口
const API_KEY = 'YOUR_API_KEY_HERE'; // 替换为你的 API Key

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API 错误:', errorData);
      return;
    }
    
    const data = await response.json();
    console.log('所有模型:', JSON.stringify(data, null, 2));
    
    if (data.models) {
      console.log('\n支持的 generateContent 模型:');
      data.models.forEach(model => {
        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${model.name} (${model.displayName})`);
          console.log(`  描述: ${model.description}`);
          console.log(`  支持的方法: ${model.supportedGenerationMethods.join(', ')}`);
          console.log('');
        }
      });
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

listModels();
