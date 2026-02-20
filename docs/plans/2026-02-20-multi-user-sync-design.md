# 666 (Design Plan)

- **日期**: 2026-02-20
- **版本**: v1.1
- **状态**: 计划中 (Draft)

## 1. 背景问题 (Context)
目前 PDA 系统采用传统的 REST API 请求模式，在多人针对同一个批次（如同一货柜）进行创建货物、中转查验或收货核验时，存在以下痛点：
- **感知滞后**: A 员工扫码录入的数据，B 员工无法实时看到，容易导致重复操作或沟通成本。
- **进度误差**: 查验页面的进度条非实时更新，导致协作效率下降。
- **状态冲突**: 批次状态（如封箱）变更不同步，导致已结束的操作仍能进行，产生无效写入。

## 2. 核心技术方案 (Core Strategy)

### 2.1 Supabase Realtime 集成
我们将启用 Supabase 的 WAL（Write-Ahead Log）实时监听频道。

- **监听对象**: `shipments` (包裹层), `batches` (批次层)。
- **同步机制**:
  1. 员工 PDA 启动后，根据当前选中的 `activeBatchId` 建立特定的实时频道订阅。
  2. 任何包裹的 `INSERT`, `UPDATE`, `DELETE` 都会触发前端回调。
  3. 前端利用 `React Query` 的 `setQueryData` 手动更新缓存，实现“无刷新”界面更新。

### 2.2 状态竞争卫语句 (Guard Clauses)
在执行 `Mutation`（提交数据）之前，增加状态前置检查。
- **逻辑**: `if (remoteBatch.status !== 'processing') throw Error('当前批次已被封存或变更')`。
- **交互**: 拦截提交请求，并弹出通知提示：“此批次状态已由同事更新，系统将自动刷新页面”。

### 2.3 协作感知与容错机制 (Fault Tolerance) - v1.1 NEW
为了防止员工误操作导致批次过早封存，引入以下逻辑：
- **活跃用户足迹 (Presence)**: 在封箱按钮旁实时显示 `Currently Online: [UserA, UserB]`。
- **未清项拦截**: 强制检查批次待处理件数，若不为零，封箱按钮需进行“长按 3 秒”或“手动输入剩余件数”确认。
- **状态回滚窗 (Rollback Window)**: 封箱成功后 5 分钟内，且数据未被下游流程读写前，支持“误点撤销”功能。

## 3. 详细实施计划

### Phase 1: 基础设施配置 (Infrastructure)
- [ ] 导出 SQL 脚本：`alter publication supabase_realtime add table shipments, batches, print_jobs;`。
- [ ] 在 `supabase.service.ts` 中初始化全局 `realtime` 客户端实例。

### Phase 2: React 钩子重构 (Refactoring Hooks)
- [ ] 更新 `useShipments.ts`:
  - 增加订阅逻辑。
  - 实现监听事件与 React Query 缓存的同步映射。
- [ ] 更新 `useBatches.ts`:
  - 订阅当前活跃批次的状态变更。

### Phase 3: 协同与安全 (Collaboration & Safety)
- [ ] **实时协作看板**:
  - 利用 `supabase_presence` 追踪活跃作业员。
  - 在 UI 上渲染“同事正参与此批次”的视觉提示。
- [ ] **智能封箱守卫**:
  - 实现封箱前的服务端全量数据对账。
  - 为封箱按钮增加 `long-press` (长按) 交互，防止手滑。
- [ ] **撤销逻辑实现**:
  - 开发 `revertBatchStatus` 后端逻辑，并记录审计日志。

### Phase 4: 测试与验证 (Validation)
- [ ] 使用两台 PDA 同时扫码同一批次。
- [ ] 在 A 设备点击封箱的操作瞬间，观察 B 设备是否弹出“已封箱”提示并禁用 UI。

## 4. 深度进化路线 (Extended Realtime Roadmap)

### 4.1 硬件协同与 BarTender 云端打印 (Hardware & BarTender Cloud Print) - EVOLVED
- **多模式切换**: 
  - 支持在设置中动态切换 **蓝牙直连 (TSPL)** 或 **BarTender 云端打印**。
- **基于 `public.print_jobs` 的实时任务路由**:
  - PDA 端不再直接连接打印机，而是向 `public.print_jobs` 表写入打印任务（Payload 包含 BTW 模板所需的 JSON 字典）。
  - **Realtime Agent**: 在 BarTender 宿主机上运行的轻量级代理服务，通过 Supabase Realtime 订阅 `INSERT` 事件。
  - **即时响应与状态反馈**: 代理服务接收任务后调用 BarTender API (XML/btxml) 打印，并实时更新任务状态（Pending -> Completed/Error）。
- **打印机 IoT 状态监测**:
  - 利用 Presence 实时显示 BarTender 集成服务（Agent）的在线状态。
  - **任务队列监控**: 实时同步 `print_jobs` 的排队积压情况，用户可实时获知打印预计等待时间。

### 4.2 协作式作业沙盘 (Collaborative Multi-tasking) - NEW
- **共享合包清单**: 多人同时往一个母包/货柜中装货时，所有人 PDA 画面同步显示已装入清单，防止重复扫描或漏扫。
- **动态任务领用**: 实现“扫码即领用”的实时锁定机制，防止两个员工同时去搬运/查验同一个超大包裹。

### 4.3 劳效实时化与游戏化 (Gamified Productivity) - NEW
- **个人实时战报**: 在 PDA 顶部显示“今日已扫/本时段排名”，利用 Realtime 实时对比仓库内同岗位的作业效率。
- **团队进度激励**: 当整个柜子完成查验时，所有参与该批次的 PDA 弹出实时庆祝特效，增强团队成就感。
