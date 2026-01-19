P0（最优先，体验提升最大，改动可控）

- 把阻塞式 alert/confirm/prompt 逐步替换为站内 Toast / Modal
    - 现状：MainView/Settings/FolderTree/AttachmentGallery/VersionCanvas/AppInitializer 中大量使用浏览器弹窗，打断编辑流、样式不一致、不可控（移动端更明显）。
    - 方案：
        - 新增一个全局 Toast（非阻塞，3s 自动消失，可手动关闭，可“复制错误详情”）。
        - 新增一个通用 ConfirmDialog（替代 confirm），支持标题/描述/危险态/确认按钮 loading。
        - 新增一个 PromptDialog（替代 prompt），支持校验（不能为空/重复名等）、支持 i18n。
    - 落地顺序（低风险）：先替换“成功/失败提示”（如保存、WebDAV 连接、上传失败），再替换“删除确认”，最后替换“输入名称”。
    - 验收：全流程不再出现浏览器原生弹窗；提示样式统一；失败提示能复制错误文本。
- 编辑器“未保存变更（Dirty）”提示 + 离开保护
    - 现状：切换版本/项目可能直接覆盖 editorContent，用户容易丢改动；保存也缺少明确反馈（多用 alert）。
    - 方案：
        - 维护 isDirty：editorContent/versionName 与当前版本快照比较。
        - 切换版本、切换项目、刷新/关闭页面时：弹出 ConfirmDialog（保留/丢弃/取消）。
        - 右上角或版本名旁显示“未保存”小标记；保存后清除并 toast “已保存”。
    - 验收：任何路径都不会静默丢编辑内容；用户能明确知道是否已保存。

P1（感知性能/流畅度，低改动）

- 关键加载态与空状态补齐（避免“空白/没反应”）
    - 现状：Sidebar 初始化 loadProjects/loadFolders 没明显 loading；一些异步动作靠 alert 反馈。
    - 方案：
        - Store 增加 isLoadingProjects/isLoadingFolders/isLoadingVersions；Sidebar/主视图展示 skeleton/占位。
        - 异步操作按钮加 loading/disabled（例如 WebDAV 列表、备份、恢复、导入）。
    - 验收：慢网/大数据时页面不会“空白”，用户知道系统在做什么。
- “预取（prefetch）”提升懒加载的等待体验
    - 现状：我们已把 Settings/CompareModal 拆包，首次打开会有短暂等待。
    - 方案（很小改动但体验明显）：
        - 鼠标 hover 设置按钮时预取 Settings chunk。
        - 进入对比模式（或点“对比”按钮）时预取 CompareModal chunk。
    - 验收：大多数情况下首次打开设置/对比几乎无等待。

P2（稳态体验与可维护性）

- 统一错误处理与“可恢复”提示
    - 方案：对 WebDAV/导入导出/附件等失败，统一 toast：简短原因 + “展开详情/复制” + 可重试按钮（可选）。
    - 验收：用户知道失败原因与下一步；减少“莫名其妙没成功”。
- i18n/文案一致性
    - 现状：FolderTree 等存在硬编码中文 prompt 文案；与现有 i18n 体系不一致。
    - 方案：把这些文案迁移到 i18n，并统一按钮/危险提示语气。
    - 验收：同一动作在各处文案一致；切换语言不漏翻译。

如果你认可这个方向，我建议下一步你先选一个“P0 子项”作为第一轮落地（我推荐：先做 Toast + ConfirmDialog，并把删除/保存/连接成功失败全部迁移），这样改动范围小，但能立刻把“打断感”和“没反馈”这两类体验痛点
压下去。你希望先从哪个流程开始：保存/对比、WebDAV、还是项目树（FolderTree）？

• 还有几类很值得做的优化（都围绕“更不丢、更清晰、更可控”）：

- 草稿/自动保存：dirty 时定期把 editorContent + versionName 存到 localStorage/IndexedDB（按 projectId+versionId 分桶），崩溃/误关后可“恢复草稿/丢弃草稿”
- 更明确的“保留”语义：在三选弹窗里把“保留”拆成“原地保存/保存为新版本”（或根据是否有 currentVersionId 显示不同按钮），避免用户不知道会保存到哪
- 可见的保存状态：保存按钮加 loading/禁用、防重复点击；保存失败时保留 dirty 并提示“未保存（保存失败）”
- 跨页面/跨路由一致保护：不仅是 Settings 按钮，任何 navigate(...)（未来新增页面/链接）都走同一套 guard（做成可复用 hook 或统一入口）
- 文档标题/版本名旁提示：除了右上角，也在 document.title 或版本名输入框旁加 *，用户切到别的标签页也能立刻感知未保存
- 外部变化冲突提示：如果同一版本在别处被更新（或多标签页同时开），检测 updatedAt/contentHash 变化并提示“发生冲突：使用本地/使用远端/另存为新版本”
