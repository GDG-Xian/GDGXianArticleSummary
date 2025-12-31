# GDG西安文章总结助手

一个Chrome浏览器扩展，帮助用户一键总结网页文章内容，提高阅读效率。

## 功能特性

- 🚀 一键总结当前网页文章内容
- ⚙️ 可调整总结长度（简短/中等/详细）
- 🌐 支持中英文总结
- 💾 自动保存用户设置
- 🎨 简洁易用的界面设计

## 安装方法

1. 克隆或下载本项目到本地
2. 打开Chrome浏览器，输入 `chrome://extensions/` 进入扩展管理页面
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」，选择项目文件夹
5. 扩展安装成功后，会在浏览器工具栏显示GDG西安文章总结助手图标

## 使用方法

1. 打开任意包含文章内容的网页
2. 点击浏览器工具栏中的扩展图标
3. 在弹出的界面中，点击「一键总结当前文章」按钮
4. 等待几秒钟，即可看到文章的总结结果
5. 可在设置中调整总结长度和语言

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- Chrome Extension API

## 项目结构

```
GDGXianArticleSummary/
├── manifest.json       # 扩展配置文件
├── background.js       # 后台脚本
├── popup.html          # 弹窗界面
├── popup.js            # 弹窗交互逻辑
├── content.js          # 内容脚本（提取网页内容）
├── images/             # 图标资源目录
│   ├── icon16.png      # 16x16 图标
│   ├── icon32.png      # 32x32 图标
│   ├── icon48.png      # 48x48 图标
│   └── icon128.png     # 128x128 图标
└── README.md           # 项目说明文档
```

## 开发说明

### 核心功能实现

1. **内容提取**：通过`content.js`脚本提取网页中的主要文章内容
2. **总结逻辑**：目前使用简单的模拟总结算法，实际项目中可替换为AI API调用
3. **后台通信**：使用Chrome Extension的消息传递机制，实现popup、background和content script之间的通信
4. **设置保存**：使用Chrome的storage API保存用户的设置偏好

### 扩展权限说明

- `activeTab`：获取当前活动标签页
- `scripting`：执行脚本
- `storage`：保存用户设置

## 自定义开发

### 添加AI总结功能

1. 在`background.js`文件中，找到`generateMockSummary`函数
2. 替换为调用AI API的实现，例如OpenAI API、百度文心一言等
3. 确保在`manifest.json`中添加必要的网络权限

### 调整内容提取规则

1. 在`content.js`文件中，修改`extractPageContent`函数
2. 添加或调整文章容器选择器，以适应更多网站

## 贡献指南

欢迎提交Issue和Pull Request来改进这个扩展！

## 许可证

MIT License

## 关于GDG西安

GDG西安是Google开发者社区（Google Developer Groups）在西安的本地社区，致力于传播Google开发者技术，促进开发者交流与成长。

更多信息请访问：[GDG西安官网](https://gdg.xian.xyz/)
