# OPC OS P0 本地启动验收报告

验收日期：2026-10-30（Asia/Shanghai）。**最终结论：PARTIAL。核心启动目标通过，完整环境与质量基线尚未全部通过。**

## 结论与访问地址

- 当前 Fork 源码在 Windows 原生成功运行；未安装 WSL。
- UI：<http://localhost:3100>；测试目标页：<http://localhost:3100/OPC/goals>。
- API：<http://127.0.0.1:3100/api/health>，HTTP 200，`status=ok`、`bootstrapStatus=ready`、`startupRecovery.phase=ready`。
- 返回的 Commit 为 `0c70cedce9a803bdc201324528abb35e423e7cd0`，与仓库一致。
- 服务仅监听 `127.0.0.1:3100`，最终检查监听 PID 为 `26640`。服务保留运行；此 PID 只代表本次会话。
- 网页创建 Company / Goal 成功；正常关闭并重新启动后，原记录 ID 与页面内容保留。
- `pnpm install` 最终退出码 1；`pnpm dev` 未通过。实际成功路径是仓库已有 `pnpm dev:server`，配合 Vite 中间件与预构建 SDK。
- `pnpm typecheck`、`pnpm test`、`pnpm build` 均已真实执行，退出码均为 1。不得将本报告视为全量质量检查通过或 Agent 执行通过。

## 仓库与改动边界

- 仓库：`D:\work\github_public_project\paperclip-person`
- origin：`https://github.com/bugrootof/paperclip-person.git`
- 分支：`master`，跟踪 `origin/master`。
- Commit：`0c70cedce9a803bdc201324528abb35e423e7cd0`。
- 初始状态：仅 `OPC-OS-P0-CODEX-TASKS.md` 未跟踪，未覆盖原任务内容，仅更新状态并追加本次说明。
- 已读取根 AGENTS、README、package.json、P0 任务单、GOAL、PRODUCT、V1 SPEC、DEVELOPING、DATABASE 相关规范及适用规则；操作以当前源码为准。
- **没有修改源码逻辑、调度器、数据库结构、哈希基线或锁文件。** 用户确认后，仅将 26 个涉及源码身份/生成文件一致性检查的文件恢复为 Git 原始 LF；清单与原始字节备份见 `lf-restoration.log`、`crlf-backup/`。
- 恢复 LF 前逐文件核对内容与 HEAD 一致；最终 `git -c core.safecrlf=false diff --numstat` 无输出。Git 状态仍可能将这些换行符恢复列为修改，健康接口亦可能显示本地改动。
- 构建命令曾重生成两个 catalog（时间戳、CRLF 对应的文件大小/哈希变化）。已将生成结果备份到 `build-generated/`，恢复这两个原本干净的 catalog，未保留无关生成变更。
- 没有重复 Clone、清库、提交或推送。没有接模型密钥、创建 Agent 或开发 Langflow/OPC 功能。

## 实测环境

| 项目 | 结果 |
| --- | --- |
| Windows | Windows 11 专业版，10.0.26200 / Build 26200 |
| PowerShell | 7.6.5；进程未提升管理员权限 |
| 原默认 Node / pnpm | 22.18.0 / 11.25.0；与仓库要求不匹配 |
| 仓库要求 | Node >=24.11.0，packageManager 为 pnpm@9.15.4 |
| 本次 Node | Codex 随附 Node 24.22.1，不改 nvm 默认版本 |
| 本次 pnpm | 独立安装 9.15.4，不改全局 pnpm |
| nvm | `F:\nvm\nvm.exe`；原有 22.18.0、20.17.0、14.21.3 |
| Git | 2.49.0.windows.1 |
| Rust | rustc / cargo 不在 PATH；仓库 toolchain 指定 1.97.1 |
| Visual C++ | vswhere 未发现 VC.Tools.x86.x64 组件 |
| Unix 工具 | Git for Windows 自带 Bash / cp 等，可通过会话 PATH 与 script-shell 使用 |
| WSL | 未安装；用户明确要求不安装，本次遵循此要求 |
| 初始状态 | node_modules 不存在，锁文件存在，3100 无监听 |

## 安装、启动与数据库

### 已执行的安装

1. `nvm install 24.11.0 64`：退出码 1，原文 `Node.js v24.11.0 is not yet released or is not available for download yet.`。nvm 使用 npmmirror；官方 Node URL 的 HEAD 返回 200，不能据此认定版本不存在。未修改 nvm 配置。
2. 曾尝试官方下载独立 Node ZIP；找到随附合格 Node 后停止该冗余下载。残留下载不是可用运行时。
3. `npm install --prefix <LOCALAPPDATA>/Paperclip/opc-p0-tools/pnpm9 --no-audit --no-fund pnpm@9.15.4`：退出码 0。
4. `pnpm install --frozen-lockfile`：出现 ECONNRESET，最后几个大包长时间下载缓慢；停止自有安装进程，退出码 -1，保留首次日志。
5. `pnpm install --frozen-lockfile --registry=https://registry.npmmirror.com`：完成所有包下载，保留锁文件完整性校验。最终根 postinstall 的目录符号链接报 EPERM，退出码 1；没有忽略生命周期脚本来伪造安装通过。
6. `cpu-features` 可选安装报 `Unable to detect compiler type`。`ssh2` 可选 node-gyp 下载头文件长时间等待，确认没有 VC 工具组件后停止该自有编译子进程；其源码明确回退，记录 `Failed to build optional crypto binding` 后继续。原生优化未验证。

### 可复现的本机启动路径

不要同时运行两个实例。在仓库根目录 PowerShell 中：

```powershell
$env:PATH = "$env:LOCALAPPDATA/Paperclip/opc-p0-tools/pnpm9/node_modules/.bin;C:/Users/Ping/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin;D:/Program Files/Git/usr/bin;D:/Program Files/Git/bin;" + $env:PATH
$env:npm_config_script_shell = 'D:/Program Files/Git/bin/bash.exe'
$env:PAPERCLIP_TELEMETRY_DISABLED = '1'
$env:DO_NOT_TRACK = '1'
$env:HOST = '127.0.0.1'
$env:PORT = '3100'
$env:PAPERCLIP_BIND = 'loopback'
$env:PAPERCLIP_HOME = 'C:/Users/Ping/AppData/Local/Paperclip/opc-p0-instance'
$env:PAPERCLIP_UI_DEV_MIDDLEWARE = 'true'
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
node -v
pnpm -v

# 首次运行需先按下文处理符号链接权限并完成安装。
# 当前机器已安装包并完成以下构建；未来干净检出须先保留相关文件 LF。
pnpm --filter @paperclipai/plugin-sdk build
pnpm --filter @paperclipai/paperclip-runner build:typescript
pnpm dev:server
```

上述为本机绝对路径；其他开发者须安装合格 Node/pnpm、Git Bash，并调整路径。此启动法成功不等于 `pnpm dev`、完整安装或 Rust 构建通过。

最初按顺序执行 `pnpm dev --data-dir ... --bind loopback`，成功创建内嵌 PostgreSQL 并应用 415 个迁移。之后 Runner 构建/需求判断暴露 CRLF、SDK 首次缺少 dist 和 Cargo 缺失；各次失败日志均保留。构建 SDK 后直接运行现有服务入口，UI/API 成功启动。

数据库是 **embedded PostgreSQL**，不是旧 AGENTS 描述的 PGlite。实际数据目录：

`C:\Users\Ping\AppData\Local\Paperclip\opc-p0-instance\instances\default\db`

数据库端口为 54329。默认实例目录下另有 data/backups。没有设置外部 DATABASE_URL；没有清空或删除任何数据库。启动横幅列出 config.json 预期路径，不代表本次执行了完整 onboard。

### 健康与页面

```powershell
Invoke-RestMethod http://127.0.0.1:3100/api/health
Invoke-WebRequest http://localhost:3100
```

均返回 HTTP 200。浏览器实际进入 onboarding 和目标页面，可正常填写并保存。最终目标页 Console warn/error 查询为空；后台仍有下列已知警告，不能称完全无错误。

## Company、Goal 与持久化

- 在 `/onboarding` 输入 `OPC P0 Fictional Lab 20261030`，点击 Continue，实际返回公司创建成功，未继续创建 Agent。
- Company ID：`350fe546-5fd6-42c5-831c-5042c6597a70`，前缀 `OPC`。
- 在 `/OPC/goals` 点击 Add Goal，填写 `P0 local persistence acceptance 20261030`，点击 Create goal。
- Goal ID：`0ec72564-c8f8-4aad-82f7-357f45b1771b`，level=task，status=planned，网页列表可见。
- 初次停止没有完整关闭日志；后续控制台 Ctrl+C 则记录 `graceful heartbeat run drain failed`，不能将这些停止称为正常关闭通过。
- 因而另外用现有导出 `startServer()` 返回的 `shutdown()` 做受控关闭，记录 heartbeat drain complete、插件协调器停止、内嵌 PostgreSQL 停止，断言 `server.listening === false`，退出码 0。HTTP 长连接 5 秒超时后走现有连接关闭逻辑。
- 随后以同一 PAPERCLIP_HOME 再次启动服务；API 确认相同 Company / Goal ID 仍存在，浏览器刷新仍可见目标。最终断言 PASS，记录在 `persistence-final.json`。期间没有重建数据。
- 最终核对脚本曾因 PowerShell 的 `@(Invoke-RestMethod)` 数组包装产生误报 `Company missing`；原始 HTTP 内容证明数据存在，改用显式 JSON 解析/枚举后同 ID 断言通过，未修复或改写业务数据。
- 截图 `goals-after-graceful-restart.png`：正常关闭并重新启动后的公司上下文与目标列表。未伪造截图或使用模拟 API。

### 受控关闭复现

当前保留运行的是 `pnpm dev:server`。普通 Windows Ctrl+C 存在上述关闭顺序问题。若需要复现干净关闭，可在停掉自有实例、确认 3100 空闲后，用以下导出入口启动一次（复用上面的环境变量），在第二个终端新建唯一 stop 文件：

```powershell
# 将示例中的 stop 文件名改成尚不存在的唯一名称。
$opcLifecycle = "import {startServer} from './server/src/index.ts'; import {existsSync} from 'node:fs'; import assert from 'node:assert/strict'; const app=await startServer(); const timer=setInterval(async()=>{if(!existsSync('C:/Users/Ping/AppData/Local/Paperclip/opc-p0-evidence/2026-10-30/request-graceful-stop-next'))return;clearInterval(timer);await app.shutdown();assert.equal(app.server.listening,false);console.log('OPC graceful shutdown PASS');process.exit(0);},1000);"
node --import ./server/node_modules/tsx/dist/loader.mjs --input-type=module -e $opcLifecycle
# 第二个终端：
# New-Item -ItemType File C:/Users/Ping/AppData/Local/Paperclip/opc-p0-evidence/2026-10-30/request-graceful-stop-next
```

这是验收用进程控制，不改源码；不要据此声称 Ctrl+C 问题已经修复。

## 质量基线：真实失败

| 命令 | 退出码 | 结果与分类 |
| --- | --- | --- |
| `pnpm typecheck` 首次 | 1 | CRLF 导致 Grok 身份检查失败；换行恢复前证据保留 |
| `pnpm typecheck` 最终 | 1 | Runner TypeScript 校验通过，typecheck:rust 因 cargo 不存在失败；整体未通过 |
| `pnpm test` 最终 | 1 | test:run 启动 general-server 时 `spawn pnpm ENOENT`；未执行用例，不能报告通过数量 |
| `pnpm build` 最终 | 1 | Runner 的 `check:protocol-manifest` 报生成的 PRP manifest stale，整体未通过；未绕过或重写基线 |
| SDK 构建 | 0 | `pnpm --filter @paperclipai/plugin-sdk build`，Git Bash shell 下成功 |
| 启动器 Runner TS 构建 | 0（子步骤） | LF 恢复后 build:typescript 全部通过；随后 dev 因 Cargo 失败 |
| LF 临时副本身份比对 | 0 | 临时 LF 副本的 Grok identity 与提交的不可变 fixture 完全一致 |
| 受控关闭 | 0 | graceful shutdown PASS，数据库与 HTTP 监听按生命周期停止 |

PRP manifest stale 尚未进一步判定为单纯换行还是其他生成差异；当前检出的 protocol 文件仍存在 CRLF，不能把失败简单归咎为上游逻辑 Bug。单测 ENOENT 属于 Windows 子进程启动路径问题，尚未修改启动器。按 P0 启动优先的范围，不修调度器、不绕过校验、不扩展到功能重构。

## 错误、限制与下一步

1. **安装符号链接权限**：根 postinstall 的 `scripts/link-plugin-dev-sdk.mjs` 用 `symlink(..., 'dir')`，当前权限报 EPERM。需要用户选择在 Windows 设置中开启开发者模式（设置中搜索“开发者模式”，授权系统提示），或在管理员 PowerShell 中仅重跑已审阅的安装命令。然后复用上面 PATH，运行 `pnpm install --frozen-lockfile --registry=https://registry.npmmirror.com`，以真实退出码确认。本次未改此系统设置或提权。
2. **Cargo/Rust**：标准 dev、全量 typecheck/build 需要工具链；若继续要求这些命令全绿，需要准备仓库指定 Rust 1.97.1 及 Windows C++ 构建工具。不要安装 WSL；先由用户处理涉及管理员授权的组件安装，再复验。
3. **CRLF**：系统 Git core.autocrlf=true。已恢复的 26 个文件内容未变，但后续 checkout 可能重新写回 CRLF；不要重新生成身份 fixture 来掩盖换行问题。清单和备份均在日志目录。
4. **单测启动**：`run-vitest-stable.mjs` 报 spawn pnpm ENOENT，需要单独处理 Windows 原生子进程兼容性；此次只记录，不宣称单测全绿。
5. **关闭信号**：Windows 控制台 Ctrl+C 可能先中断数据库，产生 drain 查询失败；已用导出 shutdown 验证正常关闭/重启持久化，但信号路径未修复。
6. **其他真实警告**：首次无数据库备份（自动备份尚未产生）；Agent JWT missing（未 onboard、未测 Agent）；Vite config/native loader 与 HMR 弃用警告；MaxListenersExceededWarning；公告外网不可用/图片 404；曾有头像接口 ERR_STREAM_UNABLE_TO_PIPE。它们未阻止本次公司/目标闭环，仍需保留为已知问题。
7. 当前服务为本次工具会话中的开发进程，未安装 Windows 服务或开机自启；不保证桌面应用退出后继续运行。重新启动使用本报告的相同数据目录。

下一步先解除安装权限、工具链和测试启动器的环境阻塞，再复跑质量基线；不进入 Langflow、Agent 调度或 OPC 新功能开发。

## 证据索引

全部日志与截图：`C:\Users\Ping\AppData\Local\Paperclip\opc-p0-evidence\2026-10-30`。

- `environment.txt`：版本、Git、端口、初始 HTTP 拒绝、后续修复/核对说明。
- `pnpm-bootstrap.log`、`install.log`、`install-mirror.log`：安装过程、网络错误、可选编译与 EPERM。
- `dev.log`、`dev-retry.log`、`dev-retry2.log`、`dev-retry3.log`：保留各次启动失败。
- `line-ending-check.log`、`lf-restoration.log`、`crlf-backup/`：换行定位、文件清单与原始备份。
- `acpx-profile-check.log`、`acpx-profile-recheck.log`：恢复过程失败和最终通过。
- `plugin-sdk-build.log`、`dev-server.log`、`final-service.log`：SDK 构建与成功服务日志。
- `restart-console.log`：控制台 Ctrl+C 关闭失败（PowerShell transcript）。
- `controlled-lifecycle.log`：正常关闭完整日志与 PASS。
- `http-checks.log`、`final-health.json`：健康与 Commit、部署模式、备份警告。
- `company-created.json`、`goals-before-restart.json`、`goals-after-restart.json`、`companies-final.json`、`goals-final.json`、`persistence-final.json`：持久化证据。
- `goals-after-graceful-restart.png`：最终网页截图。
- `typecheck.log`、`typecheck-final.log`、`test-final.log`、`build-final.log`、`baseline-exit-codes.txt`：真实质量基线。
- `build-generated/`：备份的构建生成 catalog，不作为源码修改交付。

本次为本地 Codex 工作，没有已分派的 Paperclip issue 或对应 work product 身份；未创建无关业务任务来上传验收文档。交付文件保存在用户指定仓库，日志在上述本机目录，没有声称已上传附件。P0 任务表已按实际结果更新；PARTIAL 项仍未完成。
## 2026-10-31 启动批处理

仓库根目录新增 `start-opc.bat`。双击即可进入仓库并配置本机会话的 Node、pnpm、Git Bash、禁用遥测、loopback、Vite 中间件与既有 PAPERCLIP_HOME，再调用 `pnpm dev:server`；缺少依赖或启动失败会保留窗口显示错误。保持窗口打开，访问 http://localhost:3100。脚本不安装依赖、不清库、不修改全局环境。

实测首次遇到旧 postmaster.pid 的 PID 25628 被 Windows CrossDeviceResume.exe 复用，应用安全检查拒绝启动。核对无 postgres 进程、54329 无监听后，将这一个过期锁文件改名备份为 `postmaster.pid.stale-20261031-114229`，未删除数据库文件；再次运行批处理成功启动。脚本本身不自动清理锁、不停止未知进程。既有 Cargo、测试启动器等质量基线阻塞未在本次复测。

2026-10-31 启动脚本诊断修正：缺失依赖现在显示准确文件路径、脚本位置及用户目录；依赖检查使用绝对路径，直接调用指定 pnpm。新增 --check 可仅检查路径与 Node/pnpm。已验证从其他工作目录调用成功（Node 24.22.1 / pnpm 9.15.4），模拟缺失路径时准确报错并退出 1。用户此前泛化 missing 提示未在当前环境复现，不推断具体原因；未重复启动已有 3100 服务。
