# 多人聚餐点餐助手 🍽️

一个支持多人协作点餐的网页应用，解决聚餐时一人拿菜单、口头报菜容易漏单和算不清账的痛点。

## 功能特性

- **创建/加入餐桌**：生成4位房间码，多人通过房间码加入同一餐桌
- **多人协作点餐**：每人独立浏览菜单加菜，购物车按人分组展示
- **视角切换**：支持切换不同参与者身份，模拟多人点餐效果
- **菜品备注**：支持少辣、不要香菜、忌口等个性化备注
- **提交订单**：一键提交，确认弹窗展示各人点菜明细
- **账单拆分**：支持按人结算和AA制两种模式
- **取消订单**：误下单后可取消，恢复点餐中状态
- **本地持久化**：点餐状态保存到 localStorage，刷新不丢失

## 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router v7
- Framer Motion（动画）
- shadcn/ui（UI 组件）
- Sonner（Toast 提示）
- Lucide React（图标）

## 快速开始

### 安装依赖

```bash
npm install
```

### 安装 UI 组件

项目使用 shadcn/ui，首次运行前需安装用到的组件：

```bash
npx shadcn@latest init
npm run setup:ui
```

### 启动开发服务器

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

## 项目结构

```
src/
├── components/          # 业务组件
│   ├── ui/             # shadcn/ui 组件
│   ├── CartPanel.tsx   # 购物车面板
│   ├── DishCard.tsx    # 菜品卡片
│   ├── Layout.tsx      # 全局布局
│   ├── ParticipantPanel.tsx  # 参与者面板
│   ├── QuantityControl.tsx   # 数量控制
│   └── SubmitConfirmDialog.tsx  # 提交确认弹窗
├── context/
│   └── TableContext.tsx  # 餐桌状态管理（Context + localStorage）
├── data/
│   └── menu.ts         # 菜品模拟数据
├── pages/
│   ├── HomePage/       # 首页（创建/加入餐桌）
│   ├── OrderPage/      # 点餐页
│   ├── BillPage/       # 账单页
│   └── NotFoundPage/   # 404页
├── types/
│   └── table.ts        # TypeScript 类型定义
├── hooks/
│   └── use-mobile.ts   # 移动端判断 Hook
├── lib/
│   └── utils.ts        # 工具函数
├── app.tsx             # 路由配置
├── index.tsx           # 入口文件
└── index.css           # 全局样式
```

## 说明

本项目为 MVP 原型版本，多人协作通过本地状态 + 视角切换模拟。真实多人实时同步需要后端 WebSocket 支持，可在此基础上扩展。

## License

MIT
