# 前端应用

本项目旨在提升 GPT-Researcher 的用户体验，为自动化研究提供直观高效的界面。提供两种部署方案，以适应不同的需求和环境。

## 方案一：静态前端（FastAPI）

使用 FastAPI 提供静态文件服务的轻量级方案。

#### 前置条件
- Python 3.11+
- pip

#### 安装与运行

1. 安装所需依赖：
   ```
   pip install -r requirements.txt
   ```

2. 启动服务器：
   ```
   python -m uvicorn main:app
   ```

3. 访问 `http://localhost:8000`

#### 演示
https://github.com/assafelovic/gpt-researcher/assets/13554167/dd6cf08f-b31e-40c6-9907-1915f52a7110

## 方案二：NextJS 前端

功能更丰富、性能更强的方案。

#### 前置条件
- Node.js（推荐 v18.17.0）
- npm

#### 安装与运行

1. 进入 NextJS 目录：
   ```
   cd nextjs
   ```

2. 配置 Node.js：
   ```
   nvm install 18.17.0
   nvm use v18.17.0
   ```

3. 安装依赖：
   ```
   npm install --legacy-peer-deps
   ```

4. 启动开发服务器：
   ```
   npm run dev
   ```

5. 访问 `http://localhost:3000`

注意：需要方案一中所述的、运行在 `localhost:8000` 的后端服务器。

#### 演示
https://github.com/user-attachments/assets/092e9e71-7e27-475d-8c4f-9dddd28934a3

## 如何选择

- 静态前端：搭建快速、部署轻量。
- NextJS 前端：功能丰富、可扩展、性能与 SEO 更佳。

生产环境推荐使用 NextJS。

## 前端特性

我们的前端通过以下功能增强 GPT-Researcher：

1. 直观的研究界面：简化研究问题的输入。
2. 实时进度追踪：对进行中的研究任务提供可视化反馈。
3. 交互式结果展示：便于浏览的研究成果呈现。
4. 可自定义设置：根据特定需求调整研究参数。
5. 响应式设计：在各种设备上提供最佳体验。

这些功能旨在使研究过程更高效、更易用，与 GPT-Researcher 强大的 agent 能力形成互补。
