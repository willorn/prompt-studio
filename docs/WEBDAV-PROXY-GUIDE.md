## WebDAV 跨域解决方案（坚果云）

### 目标
- 前端直接访问坚果云 WebDAV，无需单独中转服务。
- 同时兼容自定义 WebDAV。

### 核心实现
- **代理路径统一**：`/jianguoyun-dav-proxy/`（开发/生产一致）。
- **Vite 开发代理**：`vite.config.ts` 将 `/jianguoyun-dav-proxy` 代理到 `https://dav.jianguoyun.com/dav/` 并重写前缀。
- **Vercel 重写**：`vercel.json` 将 `/jianguoyun-dav-proxy/*` 重写到坚果云并附加 `cache-control: no-store`。
- **客户端兼容相对 URL**：`webdavService.configure` 若未以 `http` 开头自动补上 `window.location.origin`。
- **设置页 UX**：
  - 下拉选择「坚果云（推荐）」或「自定义 WebDAV」。
  - 选择坚果云时隐藏服务器地址输入框，默认使用 `/jianguoyun-dav-proxy/`。
  - 选择自定义时显示地址输入框，用户可填绝对 URL。

### 使用步骤
1. 开发环境：`pnpm dev`，设置页保持默认「坚果云」，只填用户名/密码即可测试连接、备份/还原。
2. 部署到 Vercel：推送后自动应用 `vercel.json` 重写，生产环境同样直接使用默认坚果云选项。
3. 自定义 WebDAV：切到「自定义」，填写完整 WebDAV 基址（如 `https://example.com/webdav/`），用户名/密码保持即可。

### 变更追踪
- `vite.config.ts`：新增并重命名代理 `/jianguoyun-dav-proxy`。
- `src/services/webdavService.ts`：支持相对 URL 自动补全。
- `src/pages/Settings.tsx`：新增服务下拉、默认坚果云、隐藏地址输入（非自定义），文案更新。
- `vercel.json`：重写与头规则改用新路径。

### 验证要点
- 本地/生产访问坚果云时无 CORS 报错，状态码 2xx/207 正常。
- 自定义模式下输入完整 URL 仍可连接。
- 备份/还原列表加载正常。
