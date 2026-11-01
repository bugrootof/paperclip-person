# OPC OS / Paperclip Fork - P0 本地启动任务单

- 目标仓库：`https://github.com/bugrootof/paperclip-person`
- 当前情况：用户已在 Windows 本地完成 `git clone`。
- 本阶段目标：原仓库安全审查、依赖就绪、源码启动、页面/API 验证、数据持久化、基础质量检查、复现文档。
- 不在本阶段：重构调度器、修改核心数据库结构、引入 Langflow、多 Agent 自动化、生产部署。

## 一、执行任务表

| ID | 优先级 | 任务 | 具体工作 | 完成判定 | 状态 |
|---|---|---|---|---|---|
| P0-01 | 必须 | 仓库安全检查 | 定位现有仓库根目录；执行 `git remote -v`、`git status --short --branch`、`git rev-parse HEAD`；检查当前工作区改动 | 能明确说明 origin、分支、Commit、未提交改动；不覆盖任何本地文件 | PASS：origin、master、Commit 与初始未跟踪文件已记录 |
| P0-02 | 必须 | 读取开发规范 | 阅读 `AGENTS.md`、`README.md`、`package.json`、`doc/DEVELOPING.md`、`doc/DATABASE.md`（如果存在） | 形成当前 Fork 版本的依赖要求与脚本清单，源码为准 | PASS：当前 Fork 的规范、依赖、脚本与数据库路径已核对 |
| P0-03 | 必须 | 环境诊断 | 检查 Windows、PowerShell、WSL2、`node -v`、`pnpm -v`、`git --version`、`rustc --version`、端口 3100 | 给出版本、缺失项、兼容性结论 | PASS：环境诊断完成，Node/pnpm 就绪，Cargo 与符号链接权限缺口已定位 |
| P0-04 | 必须 | 选择本地执行环境 | Windows 原生若有 Unix 构建脚本/嵌入式数据库问题，优先转 WSL2 Ubuntu；不为兼容性大面积修改上游源码 | 确定唯一启动路径；记录工作目录、系统、Node/pnpm | PASS：依用户后续指令不安装 WSL，选择 Windows 原生 |
| P0-05 | 必须 | 安装依赖 | 在正确仓库根目录运行 `pnpm install`；按仓库锁文件安装；解决网络、包管理与 Runner 构建问题 | 命令退出码为 0；记录安装日志 | PARTIAL：包下载完成，postinstall 符号链接 EPERM，退出码 1 |
| P0-06 | 必须 | 本地数据库/实例初始化 | 初次启动先不设置 `DATABASE_URL`，使用内嵌 PostgreSQL；只绑定回环地址；检查配置/数据路径 | DB 初始化成功；无必须外部数据库依赖 | PASS：独立 embedded PostgreSQL 初始化，415 个迁移完成，无外部 DB |
| P0-07 | 必须 | 启动服务 | 优先 `pnpm dev`；若首次配置缺失，参考仓库命令 `pnpm paperclipai run` 完成初始化；不要同时启动两个实例 | API+UI 服务持续运行、无关键错误 | PARTIAL：dev:server + Vite 已持续运行；标准 dev 因缺 Cargo 失败 |
| P0-08 | 必须 | 健康/页面验证 | 请求 `http://127.0.0.1:3100/api/health`、访问 `http://127.0.0.1:3100`，检查开发者工具 Console | 健康接口正常，网页可正常交互 | PASS：localhost UI / health 200，浏览器可交互，最终 Console 无 warn/error |
| P0-09 | 必须 | 最小业务闭环 | 在网页中创建仅使用虚构数据的测试 Company 和 Goal，记录操作步骤 | 页面中可查询到创建的数据 | PASS：网页创建虚构 Company 与 Goal，记录 ID 和截图 |
| P0-10 | 必须 | 持久化验证 | 正常关闭服务后重新启动，检查 Company/Goal 是否仍存在 | 重启后数据保留；不执行清库 | PASS：导出 shutdown 正常关闭后重启，同 ID 数据与网页保留；Ctrl+C 问题另记 |
| P0-11 | 启动后 | 质量基线 | 分别执行 `pnpm typecheck`、`pnpm test`、`pnpm build`，按当前 Fork `package.json` 决定具体脚本 | 记录每个命令的真实退出码、日志与失败分类 | 已执行但 FAIL：typecheck/test/build 均退出 1；Cargo、spawn pnpm、PRP manifest 阻塞 |
| P0-12 | 启动后 | 文档交付 | 新建 `doc/plans/opc-p0-local-start.md`，记录运行环境、命令、截图说明、数据库路径、常见问题、验收情况 | 其他开发者按文档可独立复现 | PASS：验收报告与完整日志已保存，总体结论 PARTIAL |

## 二、环境决策

1. 用户已在 Windows 中 Clone，**不要重复克隆或删除原目录**。
2. 先检查原生 Windows 是否可用；如果发现仓库脚本依赖 `cp`、`chmod`、`mkdir -p` 或嵌入式 PostgreSQL 的平台二进制问题，采用 WSL2 Ubuntu 作为首选运行环境。
3. 使用 WSL2 时优先把工作副本放在 Linux 文件系统（如 `~/projects/paperclip-person`），避免长期在 `/mnt/c` 或 `/mnt/d` 的 NTFS 路径开发导致权限/文件监听问题。复制已有仓库前确认原工作区是否有未提交修改，不可覆盖用户文件。
4. 以当前 Fork 的 `package.json` 中 `engines` 和 `packageManager` 为准。官方文档当前要求 Node.js 24.11+、pnpm 9+。
5. 本地首试不使用公共 npm 的 `paperclipai@latest` 替代 Fork 源码。**优先 `pnpm dev` 或仓库内 `pnpm paperclipai run`**。
6. 开始时不部署外部 PostgreSQL、不部署 Langflow、不接入公司真实数据。
7. 设置 `PAPERCLIP_TELEMETRY_DISABLED=1` 和 `DO_NOT_TRACK=1`，只监听 `127.0.0.1`。
8. 禁止把 API Key、Cookie、Codex 凭据、数据库密码写入 Git；禁止自动执行 `git reset --hard`、`git clean -fdx`、清空数据库或强制推送。

## 三、参考启动命令

### Windows PowerShell（只在环境兼容时执行）

```powershell
# 在已 Clone 的仓库根目录执行
Get-Location
git status --short --branch
git remote -v
node -v
pnpm -v

$env:PAPERCLIP_TELEMETRY_DISABLED = '1'
$env:DO_NOT_TRACK = '1'

pnpm install
pnpm dev
```

另开一个 PowerShell：

```powershell
Invoke-RestMethod http://127.0.0.1:3100/api/health
```

### WSL2 Ubuntu（建议作为长期本地研发环境）

```bash
# 进入 WSL2 中的工作仓库根目录；路径由 Codex 检测后确认
pwd
git status --short --branch
git remote -v
node -v
pnpm -v

export PAPERCLIP_TELEMETRY_DISABLED=1
export DO_NOT_TRACK=1

pnpm install
pnpm dev
```

另开终端：

```bash
curl -i http://127.0.0.1:3100/api/health
```

正常情况下健康接口返回 `{"status":"ok"}`；浏览器访问 `http://localhost:3100`。

若首次启动需要配置初始化，先阅读仓库说明并运行 **仓库内** `pnpm paperclipai run`（不要与 `pnpm dev` 并行启动）。

## 四、常见失败与处置顺序

| 现象 | 首先核对 | 处理优先级 |
|---|---|---|
| Node 版本过低 | `node -v` 是否满足当前 `engines` | 升级到受支持版本再装依赖 |
| pnpm 找不到 | `packageManager` 版本及 `corepack` 状态 | 安装匹配版本，不更换包管理器 |
| `cp` / `chmod` 等命令失败 | Windows shell 与仓库脚本兼容性 | 切到 WSL2；不要大改上游构建脚本 |
| 内嵌 PostgreSQL 初始化失败 | 平台二进制、当前运行用户、数据目录和权限 | 优先 WSL2 普通用户；不要自动删除数据目录 |
| 原生 Runner 无法构建 | Rust 工具链、仓库文档、兼容预编译二进制 | 按官方说明修复；记录全部日志 |
| 端口 3100 占用 | 原有程序与 Paperclip 进程 | 先检查进程归属，不直接强杀未知服务 |
| 页面空白但健康接口正常 | 前端编译、Vite 和 Console 错误 | 定位具体前端日志与依赖 |
| 重启后数据不见 | 是否切换了实例 ID、`PAPERCLIP_HOME`、`DATABASE_URL` | 恢复正确实例，不清库 |

## 五、交付物和阶段门禁

Codex 必须产生一份可审核报告：

```markdown
# OPC OS P0 本地启动验收报告

- 仓库路径：
- origin：
- 当前分支 / Commit：
- Windows / WSL2：
- Node / pnpm / Git / Rust 版本：
- 是否修改源码（文件与原因）：
- 启动命令及输出摘要：
- Web UI URL：
- API 健康检查：
- Company 创建测试：
- Goal 创建测试：
- 重启数据持久化：
- pnpm typecheck：
- pnpm test：
- pnpm build：
- 日志位置 / 已知问题：
- 最终结论：PASS / PARTIAL / FAIL
- 建议下一阶段：
```

通过条件：**当前 Fork 的源码被成功启动，API 与 UI 可访问，测试 Company / Goal 能保存，正常重启后数据仍存在。** 类型检查、单测或构建失败必须记录并定位；如因已有上游问题导致失败，不得虚报全通过。

## 六、可直接复制给 Codex 的总指令

> 我已在 Windows 本地 `git clone` 我的 Fork：`https://github.com/bugrootof/paperclip-person`。请以我目前打开的 Git 仓库为唯一工作目录，根据本文件 `OPC-OS-P0-CODEX-TASKS.md` 执行 P0 本地启动任务。你的优先目标是把 Fork **原始源码**跑起来，验证 API、UI、测试公司/目标持久化，最后形成可复现的本地启动文档。先完成仓库审查与环境诊断，再逐项实施。不得重复 Clone、覆盖本地修改、擅自清库或推送远程仓库；不得为了 Windows 兼容性大改上游核心。必要时使用 WSL2 Ubuntu，并保留原始 Windows 仓库不动。禁用第一方遥测、仅监听本地地址，暂不接入模型密钥和真实企业数据。每项任务记录 PASS/FAIL、执行命令、日志摘要和修复动作；最后提交 `doc/plans/opc-p0-local-start.md`，以及 P0 任务表的实际完成状态。若存在阻塞，保留完整错误信息并提出明确修复方案；不要声称未执行的命令已通过。

## 参考资料

- https://docs.paperclip.ing/reference/deploy/local-development/
- https://github.com/paperclipai/paperclip/blob/master/doc/DEVELOPING.md
- https://github.com/paperclipai/paperclip/blob/master/doc/DATABASE.md
- https://github.com/paperclipai/paperclip/blob/master/README.md


## 2026-10-30 本次实际执行结果

用户后续明确要求不安装 WSL，本次使用 Windows 原生。用户另确认允许仅将导致校验失败的文件恢复为 LF。核心 UI/API、网页 Company/Goal 和正常关闭后持久化通过；安装、标准 dev 和全量质量基线仍未通过，因此总体为 PARTIAL。详见 [本地启动验收报告](doc/plans/opc-p0-local-start.md)，完整日志与截图位于报告所列的 LOCALAPPDATA 目录。未清库、未修改调度逻辑、未推送。
