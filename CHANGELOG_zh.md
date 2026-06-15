# 更新日志

本文件记录 DeerFlow 的所有重要变更。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本规范](https://semver.org/lang/zh-CN/)。

[English](./CHANGELOG.md) | 中文

## [2.0.0] — 2026-06-15

DeerFlow 2.0 是围绕"超级智能体"框架的彻底重写，核心包含子智能体、持久化记忆、
沙箱执行以及可扩展的技能（Skill）/工具系统。本版本与 1.x 系列**没有共享代码**，
原有的 Deep Research 框架仍在
[`main-1.x` 分支](https://github.com/bytedance/deer-flow/tree/main-1.x)上维护。

本次发布关闭了
[2.0.0 里程碑](https://github.com/bytedance/deer-flow/milestone/1)，
自首个 2.0 里程碑标签以来累计合并 **102 个 Pull Request**。

### ⚠ 不兼容变更（Breaking Changes）

- **harness：** 从 `RunStore` 重新加载历史 run，并持久化"已中断（interrupted）"
  状态。run 的取消 / 多任务调度语义现在要求拥有该 run 的 worker 上具备可用的
  RunStore；跨 worker 的取消请求将返回 `409`，不再静默"伪成功"。([#2932])

### 新增

#### 智能体与运行时
- **智能体：** 自定义智能体支持自我更新，并按用户隔离 —— 智能体可在普通对话中
  持久化对自身 `SOUL.md` / `config.yaml` 的修改。([#2713])
- **循环检测：** 支持配置开关，并可按工具维度覆盖触发频率。([#2586]、[#2711])
- **循环检测：** 警告注入延后执行，避免与工具调用生命周期错位。([#2752])
- **运行：** 将 `model_name` 从 gateway 请求一直透传到运行时与持久化层（SQLite
  存储）。([#2775])
- **子智能体：** 通过终态任务事件，把子智能体的 token 用量流式上报到 header。
  ([#2882])

#### 模型与集成
- **模型：** 新增 StepFun 推理模型适配器。([#3461])
- **社区工具：** 新增 Brave Search 网络检索工具。([#3528])
- **渠道：** Discord 增加"仅响应 mention"模式、话题路由（thread routing）以及
  正在输入指示。([#2842])
- **IM：** 新增"用户自有 IM 渠道连接"——用户可以在运营方配置的 bot 之上，绑定
  自己的 Slack / Telegram / Discord / 飞书 / 钉钉 / 微信 / 企业微信 账号。
  ([#3487])

#### 可观测性
- **追踪：** LangGraph 追踪名设置为 `lead_agent`（自定义智能体则使用其
  `agent_name`），让 Langfuse / LangSmith 中的 trace 更清晰。([#3101])
- **前端：** 优化 token 用量的展示模式。([#2329])
- **默认值：** 默认开启 token 用量统计。([#2841])
- **默认值：** 提高默认的上下文摘要触发阈值。([#3174])

### 性能优化

- **harness：** 把 thread 元数据过滤下推到 SQL，不再在 Python 侧后过滤。
  ([#2865])
- **运行时：** 为 run 增加 `thread_id` 索引，避免 `RunManager` 中的 O(n) 扫描。
  ([#3499])
- **运行时：** 为 `MemoryRunEventStore` 中的消息建立索引，避免 O(n) 扫描。
  ([#3531])

### 安全

- **上传：** 拒绝指向符号链接的上传目标。([#2623])
- **上传：** 在 Windows 上支持基于符号链接保护的安全上传。([#2794])
- **MCP：** 在 MCP 配置接口的响应中对敏感字段进行脱敏。([#2667])
- **MCP：** 加固 MCP 配置接口对异常输入的处理。([#3425])
- **认证：** 拒绝跨站点（cross-site）的认证 POST 请求。([#2740])
- **网关：** 限制 skill artifact 预览的解压上限，避免被 zip-bomb 类构造滥用。
  ([#2963])

### 修复

#### 运行时、网关与持久化
- **运行时：** rollback 恢复的 checkpoint 现在能够覆盖更新的 checkpoint。
  ([#2582])
- **运行时：** 持久化 run 的消息摘要。([#2850])
- **运行时：** 限制 `write_file` 执行失败时上报的观测信息长度，避免失败 trace
  撑爆上下文。([#3133])
- **运行时：** 加锁保护同步单例的初始化与 reset 路径。([#3413])
- **运行时：** 为 run events 移除 PostgreSQL 上不必要的聚合
  `FOR UPDATE`。([#2962])
- **运行：** gateway 重启后从持久化存储中恢复历史 run。([#2989])
- **网关：** threads 接口返回 ISO 8601 格式的时间戳。([#2599])
- **网关：** 对已经处于 interrupted 状态的 run，cancel 接口幂等返回。
  ([#3058])
- **网关：** 将 `stream_existing_run` 拆分为按 HTTP 方法区分的多个路由，确保
  OpenAPI `operationId` 唯一。([#3228])
- **事件：** 序列化结构化的 DB event 内容。([#2762])
- **持久化：** SQLite 后端的存储统一返回带时区的时间戳。([#3130])
- **持久化：** 复用 token 用量按模型分组的 SQL 表达式。([#2910])
- **运行：** 忽略已过期的 run reconnect 冲突。([#3284])
- **nginx：** 把 CORS 策略下放到 gateway 的 allowlist，避免双重应用。
  ([#2861])

#### 智能体、子智能体与中间件
- **子智能体：** 让"子智能体超时"成为原子化的终态。([#2583])
- **子智能体：** 工具与中间件按 model 覆盖（model override）来构造。([#2641])
- **子智能体：** 把 `system_prompt` 与 skills 合并到单条 `SystemMessage`。
  ([#2701])
- **子智能体：** 子智能体与父 run 的 checkpointer 隔离。([#3559])
- **智能体：** `update_agent` 与 `setup_agent` 一致，遵循 `runtime.context` 的
  `user_id`。([#2867])
- **智能体：** 解决 `TodoMiddleware` 中 `todos` 通道的类型冲突。([#3200])
- **智能体：** 把自定义智能体路由中的阻塞文件 IO 移出事件循环。([#3457])
- **智能体：** 新智能体的 bootstrap 流程保持在用户作用域内。([#2784])
- **循环检测：** 注入 warn 时仍保持 tool-call 配对。([#2725])
- **中间件：** 同步原始 tool-call 元数据。([#2757])
- **中间件：** dangling 配对中间件正确处理非法 tool call。([#2891])
- **中间件：** 防止 todo 完成提醒消息泄漏到 IM 渠道。([#2907])
- **中间件：** 调用模型前先把 tool result 的相邻关系规范化。([#2939])

#### 记忆与追踪
- **记忆：** 用常驻事件循环替换短生命周期的 `asyncio.run()`。([#2627])
- **记忆：** 队列化的 memory 更新按智能体维度隔离。([#2941])
- **记忆：** 解析被外层包裹的 memory 更新 JSON 响应。([#3252])
- **追踪：** 把 `session_id` 与 `user_id` 透传到 Langfuse trace。([#2944])
- **追踪：** 修复中文 memory trace 信息显示为 unicode 转义序列的问题。
  ([#3104])

#### 工具、沙箱与 MCP
- **MCP：** 修复 MCP 配置中列表型变量的环境变量解析。([#2556])
- **模型：** Codex 的 token 用量记录到 `usage_metadata`。([#2585])
- **沙箱：** 在 `RemoteSandboxBackend` 中补上 `list_running`。([#2716])
- **沙箱：** Windows / Git Bash 下关闭 MSYS 路径转换。([#2766])
- **沙箱：** 沙箱就绪轮询不再阻塞事件循环。([#2822])
- **沙箱：** `Sandbox` API 边界统一遵守 `/mnt/user-data` 契约。([#2881])
- **沙箱：** Provisioner 的 PVC 数据按用户隔离。([#2973])
- **沙箱：** 合并幂等的沙箱状态更新。([#3518])
- **工具：** 引入 `Runtime` 类型别名，消除 Pydantic 序列化告警。([#2774])
- **工具：** 在重入式 `get_available_tools` 调用之间保留 `tool_search` 的提升
  状态。([#2885])
- **harness：** 为同步客户端封装仅异步可用的 config 工具。([#2878])
- **harness：** 同步客户端可用所有原本仅异步的工具（统一封装）。([#2935])

#### 技能与渠道
- **技能：** 强制校验 `allowed-tools` 元数据。([#2626])
- **技能：** 在各聊天渠道下加固 `/skill` 斜杠激活。([#3466])
- **技能：** 修复自定义 skill 安装时的权限问题。([#3241])
- **渠道：** Gateway 的命令请求需要鉴权。([#2742])

#### 认证
- **认证：** 用缓存响应替换 setup-status 接口的 429 限流。([#2915])
- **认证：** 自动生成的 JWT secret 持久化保存，重启后仍可用。([#2933])

#### 前端
- **前端：** 在 prod 模式下恢复 `getGatewayConfig` 的 `localhost` 兜底。
  ([#2718])
- **聊天：** 修复新会话第一条用户消息被吞掉的问题。([#2731])
- **前端：** header 总计 token 数采用后端线程级 token 用量。([#2800])
- **前端：** 异步 chat submit 完成后再清空输入框。([#2940])
- **前端：** 修复登录页闪烁与 ResizeObserver 死循环。([#2954])
- **前端：** 对恢复出的会话消息去重。([#2958])
- **前端：** 避免乐观渲染产生重复的用户消息。([#3002])
- **前端：** 流式中的 assistant 消息不再展示复制按钮。([#3176])
- **前端：** 新建 thread 后立即在侧边栏显示。([#3283])
- **前端：** 新建会话的 thread 消息相互隔离。([#3508])
- **前端：** 限制深层嵌套列表的缩进，避免渲染崩溃。([#3393]、[#3570])
- **token 用量：** token 用量按 message id 去重聚合。([#2770])

#### 构建、部署、脚本与配置
- **打包：** 新增 `postgres` extra 以支持 store / checkpointer，并完善安装
  说明。([#2584])
- **harness：** 运行时路径以项目根目录为基准解析。([#2642])
- **Docker：** 让 nginx 在每次请求时再解析 upstream 名称。([#2717])
- **Docker：** 把 Gateway 默认改为单 worker，避免多 worker 模式下出现异常。
  ([#3475])
- **脚本：** `make dev` 重启时保留 `uv` extras。([#2767]、[#2754])
- **脚本：** 停止时清理本地 nginx。([#3005])
- **部署：** 没有 `python3` 时，secret 生成回退到 `python` / `openssl`。
  ([#3074])
- **配置：** 让 reload boundary 在代码层面可发现。([#3144]、[#3153])
- **replay-e2e：** 重放 fixture 按调用方与会话作为 key。([#3453])

### 变更

- **provider（重构）：** 各 provider 间共享 assistant payload 的回放匹配逻辑。
  ([#3307])

### 文档

- 补充 blocking-IO 检测的使用与维护说明。([#3233])
- 清理文档中残留的"独立 LangGraph 服务器"相关内容。([#3301])

### 内部改进

- **开发：** 新增 async / thread 边界检测器。([#2936])
- **运行时：** 增加 lifecycle 端到端测试覆盖。([#2946])
- **Windows：** 后端 Makefile 各 target 加入 `PYTHONIOENCODING` 与
  `PYTHONUTF8`。([#3069])
- **blocking-io：** 检测器以"显式失败（fail-loud）"方式解析仓库根目录，并提供
  共享 CLI 入口。([#3512])

[2.0.0]: https://github.com/bytedance/deer-flow/releases/tag/v2.0.0
[#2329]: https://github.com/bytedance/deer-flow/pull/2329
[#2556]: https://github.com/bytedance/deer-flow/pull/2556
[#2582]: https://github.com/bytedance/deer-flow/pull/2582
[#2583]: https://github.com/bytedance/deer-flow/pull/2583
[#2584]: https://github.com/bytedance/deer-flow/pull/2584
[#2585]: https://github.com/bytedance/deer-flow/pull/2585
[#2586]: https://github.com/bytedance/deer-flow/pull/2586
[#2599]: https://github.com/bytedance/deer-flow/pull/2599
[#2623]: https://github.com/bytedance/deer-flow/pull/2623
[#2626]: https://github.com/bytedance/deer-flow/pull/2626
[#2627]: https://github.com/bytedance/deer-flow/pull/2627
[#2641]: https://github.com/bytedance/deer-flow/pull/2641
[#2642]: https://github.com/bytedance/deer-flow/pull/2642
[#2667]: https://github.com/bytedance/deer-flow/pull/2667
[#2701]: https://github.com/bytedance/deer-flow/pull/2701
[#2711]: https://github.com/bytedance/deer-flow/pull/2711
[#2713]: https://github.com/bytedance/deer-flow/pull/2713
[#2716]: https://github.com/bytedance/deer-flow/pull/2716
[#2717]: https://github.com/bytedance/deer-flow/pull/2717
[#2718]: https://github.com/bytedance/deer-flow/pull/2718
[#2725]: https://github.com/bytedance/deer-flow/pull/2725
[#2731]: https://github.com/bytedance/deer-flow/pull/2731
[#2740]: https://github.com/bytedance/deer-flow/pull/2740
[#2742]: https://github.com/bytedance/deer-flow/pull/2742
[#2752]: https://github.com/bytedance/deer-flow/pull/2752
[#2754]: https://github.com/bytedance/deer-flow/pull/2754
[#2757]: https://github.com/bytedance/deer-flow/pull/2757
[#2762]: https://github.com/bytedance/deer-flow/pull/2762
[#2766]: https://github.com/bytedance/deer-flow/pull/2766
[#2767]: https://github.com/bytedance/deer-flow/pull/2767
[#2770]: https://github.com/bytedance/deer-flow/pull/2770
[#2774]: https://github.com/bytedance/deer-flow/pull/2774
[#2775]: https://github.com/bytedance/deer-flow/pull/2775
[#2784]: https://github.com/bytedance/deer-flow/pull/2784
[#2794]: https://github.com/bytedance/deer-flow/pull/2794
[#2800]: https://github.com/bytedance/deer-flow/pull/2800
[#2822]: https://github.com/bytedance/deer-flow/pull/2822
[#2841]: https://github.com/bytedance/deer-flow/pull/2841
[#2842]: https://github.com/bytedance/deer-flow/pull/2842
[#2850]: https://github.com/bytedance/deer-flow/pull/2850
[#2861]: https://github.com/bytedance/deer-flow/pull/2861
[#2865]: https://github.com/bytedance/deer-flow/pull/2865
[#2867]: https://github.com/bytedance/deer-flow/pull/2867
[#2878]: https://github.com/bytedance/deer-flow/pull/2878
[#2881]: https://github.com/bytedance/deer-flow/pull/2881
[#2882]: https://github.com/bytedance/deer-flow/pull/2882
[#2885]: https://github.com/bytedance/deer-flow/pull/2885
[#2891]: https://github.com/bytedance/deer-flow/pull/2891
[#2907]: https://github.com/bytedance/deer-flow/pull/2907
[#2910]: https://github.com/bytedance/deer-flow/pull/2910
[#2915]: https://github.com/bytedance/deer-flow/pull/2915
[#2932]: https://github.com/bytedance/deer-flow/pull/2932
[#2933]: https://github.com/bytedance/deer-flow/pull/2933
[#2935]: https://github.com/bytedance/deer-flow/pull/2935
[#2936]: https://github.com/bytedance/deer-flow/pull/2936
[#2939]: https://github.com/bytedance/deer-flow/pull/2939
[#2940]: https://github.com/bytedance/deer-flow/pull/2940
[#2941]: https://github.com/bytedance/deer-flow/pull/2941
[#2944]: https://github.com/bytedance/deer-flow/pull/2944
[#2946]: https://github.com/bytedance/deer-flow/pull/2946
[#2954]: https://github.com/bytedance/deer-flow/pull/2954
[#2958]: https://github.com/bytedance/deer-flow/pull/2958
[#2962]: https://github.com/bytedance/deer-flow/pull/2962
[#2963]: https://github.com/bytedance/deer-flow/pull/2963
[#2973]: https://github.com/bytedance/deer-flow/pull/2973
[#2989]: https://github.com/bytedance/deer-flow/pull/2989
[#3002]: https://github.com/bytedance/deer-flow/pull/3002
[#3005]: https://github.com/bytedance/deer-flow/pull/3005
[#3058]: https://github.com/bytedance/deer-flow/pull/3058
[#3069]: https://github.com/bytedance/deer-flow/pull/3069
[#3074]: https://github.com/bytedance/deer-flow/pull/3074
[#3101]: https://github.com/bytedance/deer-flow/pull/3101
[#3104]: https://github.com/bytedance/deer-flow/pull/3104
[#3130]: https://github.com/bytedance/deer-flow/pull/3130
[#3133]: https://github.com/bytedance/deer-flow/pull/3133
[#3144]: https://github.com/bytedance/deer-flow/pull/3144
[#3153]: https://github.com/bytedance/deer-flow/pull/3153
[#3174]: https://github.com/bytedance/deer-flow/pull/3174
[#3176]: https://github.com/bytedance/deer-flow/pull/3176
[#3200]: https://github.com/bytedance/deer-flow/pull/3200
[#3228]: https://github.com/bytedance/deer-flow/pull/3228
[#3233]: https://github.com/bytedance/deer-flow/pull/3233
[#3241]: https://github.com/bytedance/deer-flow/pull/3241
[#3252]: https://github.com/bytedance/deer-flow/pull/3252
[#3283]: https://github.com/bytedance/deer-flow/pull/3283
[#3284]: https://github.com/bytedance/deer-flow/pull/3284
[#3301]: https://github.com/bytedance/deer-flow/pull/3301
[#3307]: https://github.com/bytedance/deer-flow/pull/3307
[#3393]: https://github.com/bytedance/deer-flow/pull/3393
[#3413]: https://github.com/bytedance/deer-flow/pull/3413
[#3425]: https://github.com/bytedance/deer-flow/pull/3425
[#3453]: https://github.com/bytedance/deer-flow/pull/3453
[#3457]: https://github.com/bytedance/deer-flow/pull/3457
[#3461]: https://github.com/bytedance/deer-flow/pull/3461
[#3466]: https://github.com/bytedance/deer-flow/pull/3466
[#3475]: https://github.com/bytedance/deer-flow/pull/3475
[#3487]: https://github.com/bytedance/deer-flow/pull/3487
[#3499]: https://github.com/bytedance/deer-flow/pull/3499
[#3508]: https://github.com/bytedance/deer-flow/pull/3508
[#3512]: https://github.com/bytedance/deer-flow/pull/3512
[#3518]: https://github.com/bytedance/deer-flow/pull/3518
[#3528]: https://github.com/bytedance/deer-flow/pull/3528
[#3531]: https://github.com/bytedance/deer-flow/pull/3531
[#3559]: https://github.com/bytedance/deer-flow/pull/3559
[#3570]: https://github.com/bytedance/deer-flow/pull/3570
