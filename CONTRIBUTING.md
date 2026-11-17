# 贡献指南 / Contributing

[项目首页 / Home](README.md) · [问题反馈 / Issues](https://github.com/dex-ovo-studio/Navio/issues) · [安全报告 / Security](https://github.com/dex-ovo-studio/Navio/blob/main/SECURITY.md)

## 反馈问题 / Report an issue

请提供 Navio 与 Windows 版本、安装或便携方式、复现步骤、预期结果和实际结果。提交前移除订阅链接、节点密码、令牌和账号资料。安全问题按安全页面的私密流程报告。

Include the Navio and Windows versions, installer or portable mode, reproduction steps, and expected and actual results. Remove subscription links, node passwords, tokens, and account details. Use the private process on the security page for security reports.

## 提交变更 / Submit changes

应用代码、README 和用户文档的 PR 均以 `main` 为目标。提交时说明行为变化和验证结果。更新双语文档时，保持中英文一致并核对链接及发行状态。

Target `main` for changes to the application, README and user documentation. Describe what changed and how you verified it. Keep bilingual documentation in sync and check links and release status.

## 本地开发 / Local development

使用 Node.js 24+ 和 `package.json` 固定的 pnpm。 / Use Node.js 24+ and the pnpm version specified in `package.json`.

```powershell
pnpm install --ignore-scripts --frozen-lockfile
pnpm run hooks:install
pnpm run review
pnpm exec vitest run --exclude src/main/utils/app-info/linux.test.ts
```

打包步骤见 [Windows 构建说明 / Windows build guide](DEX-BUILD.txt)。系统代理、TUN、服务和实际升级需要单独在 Windows 中验收。提交中保留第三方出处和许可，剔除依赖目录、构建产物与用户数据。

See the Windows build guide for packaging. System proxy, TUN, service mode and upgrades need separate runtime verification on Windows. Keep third-party attributions and licenses, and keep dependencies, build output and user data out of commits.

更新发行文档时，请核对该版本的软件包、对应源码、校验文件及随包第三方组件许可。

When updating release documentation, check the version's binaries, corresponding source, checksums, and the licenses of bundled third-party components.
