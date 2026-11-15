<p><img align="top" src="https://raw.githubusercontent.com/dex-ovo-studio/Navio/main/.github/assets/ui/contributing.svg" alt="Navio · contributing" width="100%"></p>

[← Navio](https://github.com/dex-ovo-studio/Navio) · [使用指南](https://github.com/dex-ovo-studio/Navio/blob/main/docs/guide.md) · [版本与下载](https://github.com/dex-ovo-studio/Navio/releases)

# 参与开发

欢迎通过 Issue 提交问题和建议，通过 Pull Request 提交修改。

## 问题反馈

请提供 Navio 与 Windows 版本、复现步骤、预期结果和实际结果。日志和截图中不要包含订阅链接、节点密码、令牌或账号资料。安全漏洞请按 [SECURITY.md](SECURITY.md) 私下报告。

## 本地开发

开发分支为 `main`。默认 `showcase` 分支用于产品展示；提交代码修改时，请将 Pull Request 的目标设为 `main`。

使用 Node.js 24+ 和 `package.json` 指定的 pnpm：

```powershell
pnpm install --ignore-scripts --frozen-lockfile
pnpm run hooks:install
```

运行资源和打包步骤见 [DEX-BUILD.txt](DEX-BUILD.txt)。依赖变更通过 pnpm 更新锁文件。

提交前运行：

```powershell
pnpm run format:check
pnpm run lint:check
pnpm run typecheck
```

Windows 单元测试：

```powershell
pnpm exec vitest run --exclude src/main/utils/app-info/linux.test.ts
```

Linux 路径相关测试在 Linux 上运行。系统代理、TUN、服务安装和升级需另做对应的运行验证。

## Pull Request

说明修改目的、行为变化和测试结果。保留来源及许可声明，不提交依赖目录、构建产物、个人配置或用户数据。提交钩子需正常通过。
