# 项目开发全链路工作流 (Full-Stack Workflow)

为了确保本项目的高质量闭环开发，AI 助手在处理新需求时必须遵循以下六步工作流：

## 第一阶段：需求对齐与能力发现
1. **深度澄清 (Deep Clarification)**：
   - 针对需求中的业务逻辑、交互细节、角色权限等模糊部分提问。
   - 确保完全理解用户的意图后再进入下一步。

2. **能力检索 (Skill Retrieval)**：
   - 使用 `find-skills` 工具检索是否存在可复用的现有技能。
   - **产出与安装**：通过 `npx skills find` 获取相关的库、最佳实践或工具包。如果发现匹配的 Skill，**必须安装并参考其文档进行开发**。
   - **总结传递**：在进入第二阶段前，必须将从 Skill 中学习到的组件规范、图标规范或最佳实践进行**显式总结**，作为后续建模和编码的输入。

## 第二阶段：视觉与数据建模
3. **视觉建模 (Stitch UI/UX Generation)**：
   - 使用 `stitch` 工具生成或编辑前端界面模型。
   - **操作**：调用 `generate_screen_from_text` 或 `edit_screens`。如果用户提供了参考图（Image），则基于参考图生成对应的 UI 结构，旨在视觉上“WOW”到用户。
   - **目标**：在写代码前先与用户确认视觉风格。

4. **数据建模 (Supabase Database Migration)**：
   - 根据需求和 UI 逻辑，设计/更新数据库模式。
   - **操作**：使用 `mcp_supabase-mcp-server_apply_migration` 执行 DDL 操作。
   - **要求**：必须处理 RLS 策略、索引优化及自动化 Triggers。

## 第三阶段：编码实现与验证
5. **编码实现 (Full Implementation)**：
   - 基于 Stitch 的 UI 方案和 Supabase 的数据层实现完整的 React/TypeScript 代码。
   - **原则**：利用已检索到的 Skills 指引，确保代码符合现代 Web 最佳实践（如响应式、语义化、高性能）。

6. **优化与抛光 (Polish & Validation)**：
   - 检查 RLS 安全性，运行 `get_advisors`。
   - 确保 UI 交互丝滑（加载状态、微动画、空状态处理）。

---
*注：此工作流为强制标准，AI 助手需在每一步完成后主动请求用户反馈。*
