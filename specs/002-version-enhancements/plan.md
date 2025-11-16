# Implementation Plan: 版本增强功能集

**Branch**: `002-version-enhancements` | **Date**: 2025-11-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-version-enhancements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本功能集为 Prompt Studio 添加6个核心增强功能：

1. **版本对比 (P1)**: 实现全屏模态框中的并排Diff视图，使用@codemirror/merge扩展包
2. **重复内容提醒 (P2)**: 基于contentHash的去重检查，创建新版本前提示用户
3. **面板宽度调节 (P2)**: 主画布与右侧面板之间的可拖动分隔符，支持宽度比例持久化
4. **非叶子版本原地保存 (P3)**: 移除叶子节点限制，允许所有版本使用原地更新
5. **版本树搜索 (P2)**: 全文搜索+结果导航，支持跳转和高亮匹配版本
6. **UI优化 (P3)**: 画布控制按钮移至右下角，移除操作提示文字

技术方案：在现有架构基础上扩展，利用已有的Zustand状态管理、Dexie.js封装的IndexedDB、CodeMirror 6编辑器和React组件体系，无需引入新的核心依赖。

## Technical Context

**Language/Version**: TypeScript 5.3.3  
**Primary Dependencies**: React 18.2 (Hooks), TailwindCSS 3.4, Vite 5.0.8  
**Storage**: IndexedDB (via Dexie.js 3.2.4)  
**Testing**: Vitest 1.0.4 (unit/component), React Testing Library 14.1.2, Browser E2E (chrome-devtools-mcp优先)  
**Target Platform**: Modern browsers (Chrome/Edge/Firefox) + Cloudflare Workers / Deno Deploy
**Project Type**: Web (单页应用SPA)  
**Performance Goals**: 
  - 搜索响应: <200ms (100个版本全文搜索)
  - contentHash计算: <500ms (10KB Prompt内容)
  - 面板拖动: 60fps流畅度 (<16ms帧时间)
  - Diff视图渲染: <1s (5000字符对比)
**Constraints**: 
  - 本地优先: 所有功能无后端依赖
  - 离线可用: 完全在客户端完成
  - 最小宽度: 面板不得小于200px
  - 兼容性: 支持ES2020+浏览器
**Scale/Scope**: 
  - 单项目版本数: 支持1000+版本
  - 搜索范围: 当前项目所有版本
  - 并发用户: 单用户本地应用
  - UI响应式: 桌面端(>1024px)优先，平板/移动端适配


## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **本地优先验证**: 所有功能在客户端完成，无后端依赖？
  - ✅ 版本对比、搜索、去重、面板调节均为纯客户端操作
  - ✅ 使用IndexedDB存储版本数据和布局偏好
  - ✅ 无需任何服务器API调用
  
- [x] **Material Design 3 合规**: UI 组件遵循 M3 规范，色彩对比度达标？
  - ✅ 对比模态框使用M3的Dialog/Modal组件
  - ✅ 重复提醒对话框遵循M3 AlertDialog规范
  - ✅ 搜索框使用M3 TextField + Icon Button组件
  - ✅ 画布控制按钮使用M3 Icon Button，符合触控尺寸(44x44px)
  - ✅ 所有色彩使用M3动态色彩方案(Primary/Surface/OnSurface等)
  
- [x] **平台无关性**: 核心逻辑与 UI 分离，部署适配层最小化？
  - ✅ 搜索逻辑封装在独立的searchService.ts中
  - ✅ 面板宽度管理封装在layoutManager.ts中
  - ✅ Diff计算已在diffService.ts中分离
  - ✅ UI组件仅负责渲染和事件处理
  
- [x] **扁平化数据**: 数据模型以扁平数组存储，ID 引用关联？
  - ✅ Version模型保持扁平结构，无嵌套对象
  - ✅ 搜索结果存储为版本ID列表(string[])
  - ✅ 布局偏好存储为简单键值对
  - ✅ 对比请求仅记录两个版本ID
  
- [x] **可访问性标准**: 键盘导航、屏幕阅读器支持完整？
  - ✅ 对比模态框支持ESC键关闭
  - ✅ 搜索框支持Enter键跳转
  - ✅ 画布控制按钮提供aria-label
  - ✅ 面板拖动时鼠标光标提示(↔)
  - ✅ 版本卡片高亮状态有足够的视觉对比度
  
- [x] **轻量依赖**: 选择的库符合 YAGNI 原则，避免过度工程？
  - ✅ @codemirror/merge已存在于package.json，直接复用
  - ✅ js-sha256已存在，用于contentHash计算
  - ✅ 面板拖动使用原生React事件，无需额外库
  - ✅ 搜索功能使用原生String.includes()，无需全文搜索引擎
  
- [x] **测试覆盖**: 单元测试 + 组件测试 + 浏览器 E2E 测试计划完整？
  - ✅ 单元测试: searchService, layoutManager, 去重逻辑
  - ✅ 组件测试: CompareModal, SearchBar, ResizableSplitter
  - ✅ E2E测试: 完整对比流程、搜索跳转、面板拖动持久化

**结论**: 所有检查项通过，无违反核心原则，无需复杂度豁免。


## Project Structure

### Documentation (this feature)

```text
specs/002-version-enhancements/
├── plan.md              # 本文件 (/speckit.plan 命令输出)
├── research.md          # Phase 0 输出 (技术调研结果)
├── data-model.md        # Phase 1 输出 (数据模型设计)
├── quickstart.md        # Phase 1 输出 (开发快速上手指南)
├── contracts/           # Phase 1 输出 (API契约，本项目为组件接口)
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
└── checklists/
    └── requirements.md  # 需求质量检查清单
```

### Source Code (repository root)

基于现有项目结构，本功能将在以下位置添加/修改代码：

```text
src/
├── components/
│   ├── canvas/
│   │   ├── VersionCanvas.tsx              # [修改] 添加搜索框、画布控制按钮
│   │   └── SearchBar.tsx                  # [新增] 版本树搜索组件
│   ├── common/
│   │   ├── Modal.tsx                      # [复用] 已有模态框组件
│   │   ├── ResizableSplitter.tsx          # [新增] 可拖动分隔符组件
│   │   └── DuplicateDialog.tsx            # [新增] 重复提醒对话框
│   ├── version/
│   │   ├── DiffViewer.tsx                 # [重构] 使用@codemirror/merge
│   │   └── CompareModal.tsx               # [新增] 版本对比模态框
│   └── layout/
│       └── MainLayout.tsx                 # [新增] 统一布局容器(含拖动分隔)
├── services/
│   ├── diffService.ts                     # [修改] 集成@codemirror/merge
│   ├── searchService.ts                   # [新增] 版本搜索服务
│   ├── layoutManager.ts                   # [新增] 布局偏好管理
│   └── versionManager.ts                  # [修改] 去重检查UI集成
├── store/
│   ├── versionStore.ts                    # [修改] 添加对比和搜索状态
│   ├── uiStore.ts                         # [修改] 添加布局状态
│   └── searchStore.ts                     # [新增] 搜索状态管理
├── hooks/
│   ├── useVersionCompare.ts               # [新增] 版本对比hook
│   ├── useVersionSearch.ts                # [新增] 版本搜索hook
│   └── useResizable.ts                    # [新增] 面板拖动hook
├── pages/
│   ├── MainView.tsx                       # [修改] 集成新布局和功能
│   └── DiffView.tsx                       # [重构] 使用新CompareModal
└── utils/
    ├── hash.ts                            # [复用] contentHash计算
    └── storage.ts                         # [新增] localStorage辅助函数

tests/
├── unit/
│   ├── searchService.test.ts              # [新增] 搜索服务单元测试
│   ├── layoutManager.test.ts              # [新增] 布局管理单元测试
│   └── versionStore.test.ts               # [修改] 添加去重测试
├── component/
│   ├── CompareModal.test.tsx              # [新增] 对比模态框组件测试
│   ├── SearchBar.test.tsx                 # [新增] 搜索栏组件测试
│   ├── ResizableSplitter.test.tsx         # [新增] 拖动分隔符组件测试
│   └── DuplicateDialog.test.tsx           # [新增] 重复对话框组件测试
└── e2e/
    ├── version-compare.e2e.ts             # [新增] 版本对比E2E测试
    ├── version-search.e2e.ts              # [新增] 版本搜索E2E测试
    ├── panel-resize.e2e.ts                # [新增] 面板拖动E2E测试
    └── duplicate-warning.e2e.ts           # [新增] 重复提醒E2E测试
```

**Structure Decision**: 
采用Web应用的标准结构，遵循现有项目的组织方式。所有组件按功能域划分（canvas/version/common/layout），服务层封装业务逻辑，状态管理使用Zustand。本次功能主要为扩展性修改，新增组件占比60%，修改现有组件占比40%。


## Complexity Tracking

无需填写。本功能未违反Constitution Check中的任何核心原则。


---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown

## Phase 0: Research & Technical Decisions

### 研究任务清单

**Task 1**: 评估@codemirror/merge扩展包的集成方案
- **决策**: 使用@codemirror/merge替换现有的自定义Diff实现
- **理由**: 
  - 官方扩展包，维护活跃，API稳定
  - 提供Side-by-Side和Unified两种视图模式
  - 内置高性能Diff算法(Myers算法)
  - 完美集成CodeMirror 6的Extension系统
- **替代方案**: react-diff-view, monaco-editor diff
- **拒绝原因**: 
  - react-diff-view: 非CodeMirror生态，需额外学习成本
  - monaco-editor: 体积过大(>2MB)，违反轻量依赖原则

**Task 2**: 研究React中实现可拖动分隔符的最佳实践
- **决策**: 使用原生React事件(onMouseDown/onMouseMove/onMouseUp)实现
- **理由**:
  - 无需额外依赖，控制精度高
  - 支持触控设备(onTouchStart/onTouchMove)
  - 易于集成ResizeObserver监听窗口变化
  - 性能优异，可达60fps
- **替代方案**: react-split-pane, react-resizable-panels
- **拒绝原因**:
  - react-split-pane: 库已停止维护(最后更新2018)
  - react-resizable-panels: 功能过于复杂，本项目只需简单的2栏拖动

**Task 3**: 确定面板宽度比例的持久化方案
- **决策**: 使用localStorage存储宽度比例(0-1的浮点数)
- **理由**:
  - 简单键值对存储，无需IndexedDB事务开销
  - 同步API，读取无延迟
  - 浏览器兼容性极佳(IE8+)
- **数据格式**: 
  ```json
  {
    "layout.canvasPanelWidthRatio": 0.6
  }
  ```
- **替代方案**: IndexedDB, cookie
- **拒绝原因**:
  - IndexedDB: 异步操作，布局恢复需await，影响初始渲染速度
  - cookie: 大小限制4KB，且会随请求发送(本项目无后端但不符合最佳实践)

**Task 4**: 版本树搜索算法选择
- **决策**: 使用简单的String.includes()进行不区分大小写的文本匹配
- **理由**:
  - 原生API，无依赖，性能优异
  - 对于1000个版本以内的项目，线性遍历耗时<200ms
  - 支持中文、英文、特殊字符
- **实现**:
  ```typescript
  const searchVersions = (versions: Version[], query: string): string[] => {
    const lowerQuery = query.toLowerCase();
    return versions
      .filter(v => v.content.toLowerCase().includes(lowerQuery))
      .map(v => v.id);
  };
  ```
- **替代方案**: Fuse.js (模糊搜索), lunr.js (全文索引)
- **拒绝原因**:
  - Fuse.js: 本项目不需要模糊匹配，精确匹配即可满足需求
  - lunr.js: 需预建索引，增加复杂度，且索引需在版本变化时更新

**Task 5**: 重复提醒对话框的用户体验设计
- **决策**: 使用阻塞式Modal对话框，提供"仍然创建"和"取消"两个选项
- **理由**:
  - 阻止误操作，用户必须明确选择
  - 显示已有版本的ID和创建时间，帮助用户判断
  - 符合M3的AlertDialog交互模式
- **替代方案**: Toast通知, 非阻塞式警告
- **拒绝原因**:
  - Toast: 用户可能忽略，无法阻止重复创建
  - 非阻塞警告: 需额外状态管理，用户体验不够明确

**Task 6**: 非叶子节点原地保存的安全性评估
- **决策**: 移除叶子节点限制，允许所有版本原地保存
- **风险评估**:
  - ✅ 不破坏版本树结构(子版本的parentId保持不变)
  - ✅ contentHash更新不影响子版本
  - ✅ updatedAt变化符合预期(反映最后修改时间)
  - ⚠️ 需在UI明确提示"此操作会修改历史版本"
- **安全措施**:
  - 在原地保存按钮上添加特殊样式(如警告色)
  - 快捷键保持Ctrl+Shift+Enter(比Ctrl+Enter更难误触)
  - 操作后显示Toast确认"版本已原地更新"

### 技术决策总结

| 领域 | 技术选择 | 依赖 | 理由 |
|
---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown
---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown|
---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown
---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown
---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown-|
---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown
---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown|
---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown
---

## Phase 1: Design & Contracts (Completed)

### 数据模型设计

✅ 完成 `data-model.md`:
- 定义SearchState, CompareState, LayoutPreference
- 扩展VersionStore, UIStore, 新增SearchStore
- 确定localStorage存储方案
- 数据流图和性能优化策略

### API契约定义

✅ 完成组件契约 (contracts/):
- `CompareModal.contract.md`: 版本对比模态框
- `SearchBar.contract.md`: 搜索输入框
- `ResizableSplitter.contract.md`: 可拖动分隔符
- `DuplicateDialog.contract.md`: 重复提醒对话框

### 开发指南

✅ 完成 `quickstart.md`:
- 10-15天开发路线图
- 关键代码片段
- 测试策略和示例
- 常见问题解决方案

---

## Phase 2: Implementation Tasks (待/speckit.tasks生成)

任务分解将在执行 `/speckit.tasks` 命令时生成，包括：

### 预期任务结构

**Task Group 1: 版本对比 (P1)**
- Task 1.1: 升级diffService，集成@codemirror/merge
- Task 1.2: 实现CompareModal组件
- Task 1.3: 扩展versionStore，添加compareState
- Task 1.4: E2E测试: version-compare.e2e.ts

**Task Group 2: 重复内容提醒 (P2)**
- Task 2.1: 实现checkDuplicate方法
- Task 2.2: 创建DuplicateDialog组件
- Task 2.3: 集成到createVersion流程
- Task 2.4: E2E测试: duplicate-warning.e2e.ts

**Task Group 3: 面板拖动 (P2)**
- Task 3.1: 实现useResizable hook
- Task 3.2: 创建ResizableSplitter组件
- Task 3.3: 扩展uiStore，添加layoutPreference
- Task 3.4: E2E测试: panel-resize.e2e.ts

**Task Group 4: 版本搜索 (P2)**
- Task 4.1: 实现searchService
- Task 4.2: 创建searchStore
- Task 4.3: 实现SearchBar组件
- Task 4.4: 集成到VersionCanvas
- Task 4.5: E2E测试: version-search.e2e.ts

**Task Group 5: 非叶子保存 + UI优化 (P3)**
- Task 5.1: 移除叶子节点限制
- Task 5.2: UI优化 (按钮位置、提示移除)
- Task 5.3: 完整回归测试

---

## Re-evaluation: Constitution Check (Post-Design)

*对Phase 1设计完成后的合规性再次检查*

- [x] **本地优先验证**: 
  - ✅ 所有新增功能均为纯客户端实现
  - ✅ 无后端API调用，无网络依赖
  - ✅ 使用IndexedDB和localStorage本地存储

- [x] **Material Design 3 合规**: 
  - ✅ CompareModal遵循M3 Dialog规范
  - ✅ DuplicateDialog遵循M3 AlertDialog规范
  - ✅ SearchBar使用M3 TextField + Icon Button
  - ✅ 所有组件色彩对比度符合WCAG 2.1 AA标准

- [x] **平台无关性**: 
  - ✅ 核心逻辑封装在services层
  - ✅ UI组件仅负责渲染和事件处理
  - ✅ 状态管理与视图分离(Zustand)

- [x] **扁平化数据**: 
  - ✅ 所有新增状态均为扁平结构
  - ✅ 使用ID引用关联版本
  - ✅ 无嵌套对象，易于序列化

- [x] **可访问性标准**: 
  - ✅ 所有模态框支持ESC键关闭
  - ✅ 搜索支持键盘导航(Enter/Shift+Enter)
  - ✅ 画布控制按钮符合44x44px触控最小尺寸
  - ✅ 所有交互元素有aria-label

- [x] **轻量依赖**: 
  - ✅ 零新增npm包
  - ✅ 复用已有依赖(@codemirror/merge, js-sha256)
  - ✅ 原生API优先(String.includes, localStorage)

- [x] **测试覆盖**: 
  - ✅ 单元测试: 5个服务/工具模块
  - ✅ 组件测试: 4个React组件
  - ✅ E2E测试: 5个用户流程
  - ✅ 预期覆盖率: 核心逻辑>80%

**结论**: 设计阶段未引入新的合规性问题，所有检查项保持通过。

---

## Summary & Next Steps

### 已完成 (Phase 0-1)

✅ **Phase 0: Research**
- 6个技术决策确定
- 零新增依赖，全部复用现有技术栈
- 性能指标预期均达标

✅ **Phase 1: Design & Contracts**
- 数据模型设计 (data-model.md)
- 4个组件契约 (contracts/)
- 开发快速上手指南 (quickstart.md)

### 待执行

⏳ **Phase 2: Implementation Tasks** (需执行 `/speckit.tasks`)
- 任务分解 (tasks.md)
- 开发排期
- 验收标准

### 文件清单

```
specs/002-version-enhancements/
├── spec.md                          ✅ 需求规格
├── plan.md                          ✅ 本文件 - 实施计划
├── research.md                      ✅ 技术调研
├── data-model.md                    ✅ 数据模型
├── quickstart.md                    ✅ 开发指南
├── contracts/                       ✅ 组件契约
│   ├── CompareModal.contract.md
│   ├── SearchBar.contract.md
│   ├── ResizableSplitter.contract.md
│   └── DuplicateDialog.contract.md
├── checklists/
│   └── requirements.md              ✅ 需求质量检查
└── tasks.md                         ⏳ 待生成 (/speckit.tasks)
```

### Agent Context更新

需要更新 `.specify/memory/agent.codebuddy.md` (如使用Codebuddy) 或对应的agent文件，添加以下技术栈信息：

**新增组件**:
- CompareModal: 版本对比模态框 (@codemirror/merge)
- SearchBar: 版本树搜索框 (防抖输入 + 结果导航)
- ResizableSplitter: 可拖动面板分隔符 (原生React事件)
- DuplicateDialog: 重复内容提醒对话框 (M3 AlertDialog)

**新增服务**:
- searchService: 版本全文搜索 (String.includes)
- layoutManager: 布局偏好管理 (localStorage)

**新增状态**:
- SearchStore: 搜索状态 (query, matches, currentIndex)
- CompareState: 对比状态 (sourceVersionId, targetVersionId)
- LayoutPreference: 布局偏好 (canvasPanelWidthRatio)

---

## 开发准备就绪

**分支**: `002-version-enhancements` ✅  
**规格说明**: 完整 ✅  
**技术方案**: 确定 ✅  
**数据模型**: 设计完成 ✅  
**组件契约**: 定义清晰 ✅  
**开发指南**: 可用 ✅  

**下一步**: 执行 `/speckit.tasks` 生成详细的开发任务清单。

---

**Created**: 2025-11-16  
**Last Updated**: 2025-11-16  
**Status**: Phase 1 Complete, Ready for Task Breakdown|
| 版本对比 | @codemirror/merge | 已存在 | 官方扩展，高性能，API稳定 |
| 面板拖动 | 原生React事件 | 无 | 零依赖，性能优异，完全可控 |
| 布局持久化 | localStorage | 浏览器原生 | 同步API，简单可靠 |
| 版本搜索 | String.includes() | 原生JS | 无依赖，满足性能要求 |
| 重复提醒UI | Modal + AlertDialog | 已有组件 | 阻塞式交互，防误操作 |
| 哈希计算 | js-sha256 | 已存在 | SHA-256标准算法 |

**结论**: 所有技术决策均符合"轻量依赖"和"YAGNI"原则，无需引入新的npm包。
