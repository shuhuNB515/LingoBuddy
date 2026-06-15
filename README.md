# LingoBuddy (灵语伴聊)

> 你的首个零压力、全天候、超地道的英语口语高分搭子

LingoBuddy 是一款基于端到端 AI 技术的全沉浸式智能英语口语陪练工具。专为希望摆脱"哑巴英语"、提升真实场景沟通能力的学习者打造。通过拟真的人类语音交互和保姆级的全方位复盘，为用户提供 24 小时随身、零社交压力的地道口语陪练体验。

## 核心亮点

### 全场景真题实战
告别机械的背诵，内置外企面试、商务会议、海外点餐、海关通关等上百个真实生活与职场场景，AI 扮演不同性格、口音的对话角色。

### 毫秒级极速响应
采用前沿的流式音频处理技术，打造丝滑的端到端实时对练，延迟低至毫秒级，拒绝传统 AI 聊天"走神、卡顿"的尴尬。

### 无痛式"不打断"纠错
对话过程中 AI 化身温柔的倾听者，不粗暴打断。在界面中以视觉形式默默记录用户的语法、词汇与发音瑕疵。

### 多维度量化复盘
告别"感觉自己退步了"的焦虑。每场对话后，基于 CEFR（欧洲语言共同参考框架）标准，从发音准确度、词汇丰富度、语法正确率和表达流利度四个维度生成可视化的全景能力雷达图，并附带专属的"地道润色建议（Polished Version）"。

## 技术底座

### 前端客户端
- 基于 WebRTC 协议实现低延迟音频双向流传输
- React + TypeScript + Vite 构建
- Zustand 状态管理
- 支持移动端多平台随时随地一键开启对话

### 后端引擎
- Go 高性能信令服务器 + WebSocket 实时通信
- Python FastAPI AI 引擎服务
- 前沿大模型多模态音频直连技术（原生语音大模型）
- 提供最具人情味的情绪语气与语调回馈

## 项目结构

```
LingoBuddy/
├── client/                 # 前端 React 应用
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 页面
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── store/          # Zustand 状态管理
│   │   ├── services/       # WebRTC & API 服务
│   │   └── utils/          # 工具函数
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                 # 后端服务
│   ├── signaling/          # Go 信令服务器
│   │   ├── main.go
│   │   └── go.mod
│   └── ai-engine/          # Python AI 引擎
│       ├── main.py
│       ├── analyzers/      # 复盘分析模块
│       └── requirements.txt
└── docker/                 # Docker 部署配置
    └── docker-compose.yml
```

## 快速开始

### 前端

```bash
cd client
npm install
npm run dev
```

### 后端 - Go 信令服务

```bash
cd server/signaling
go run main.go
```

### 后端 - Python AI 引擎

```bash
cd server/ai-engine
pip install -r requirements.txt
python main.py
```

### Docker 一键部署

```bash
cd docker
docker-compose up -d
```

## License

MIT
