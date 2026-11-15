<div align="center">

# Navio

适用于 Windows 的代理管理客户端

**Windows x64 · Public Beta 7**

[下载 Navio](https://github.com/dex-ovo-studio/Navio/releases/latest) · [使用指南](docs/guide.md) · [更新日志](CHANGELOG.md) · [问题反馈](https://github.com/dex-ovo-studio/Navio/issues)

D.E.X Studio

</div>

---

## 产品概览

Navio 集成订阅管理、节点选择、分流规则与连接监控，提供标准和简易两种界面模式，支持系统代理与 TUN。

| 功能       | 说明                                           |
| ---------- | ---------------------------------------------- |
| 订阅与节点 | 导入和管理配置，切换代理组，收藏节点并检测延迟 |
| 代理与规则 | 配置系统代理、TUN 和分流规则                   |
| 连接与日志 | 查看连接状态、流量统计和运行日志               |
| 主题与外观 | 使用内置主题，或通过主题工坊调整界面外观       |
| 备份与更新 | 备份、恢复本地配置，并在软件内检查更新         |

## 下载与安装

在 [GitHub Releases](https://github.com/dex-ovo-studio/Navio/releases/latest) 获取最新公测版本。

| 分发形式 | 启动方式                                          |
| -------- | ------------------------------------------------- |
| 安装版   | 运行 `setup.exe` 安装程序，按向导完成安装         |
| 免安装版 | 完整解压 `portable.zip`，运行目录中的 `Navio.exe` |

当前提供 Windows x64 版本。升级前请从系统托盘退出正在运行的 Navio。

## 快速开始

1. 启动 Navio，登录 D.E.X 账号。
2. 导入订阅地址或本地配置文件。
3. 选择代理组与节点，按需启用系统代理或 TUN。

Navio 不提供代理线路，订阅及节点需自行配置。首次登录与在线功能需要联网；TUN 首次配置可能需要管理员授权。

安装、升级、数据迁移和常见问题，请参阅[使用指南](docs/guide.md)。

## 文档与支持

- [使用指南](docs/guide.md)：安装、连接、更新与备份。
- [构建说明](DEX-BUILD.txt)：开发环境、运行资源与打包步骤。
- [参与开发](CONTRIBUTING.md)：问题反馈与代码贡献。
- [安全报告](SECURITY.md)：漏洞及安全问题反馈方式。

## 开源与许可

Navio 由 D.E.X Studio 开发，基于 [Clash Party](https://github.com/mihomo-party-org/clash-party) 与 [Mihomo](https://github.com/MetaCubeX/mihomo)。客户端采用 [GPL-3.0-only](LICENSE) 许可；第三方组件的来源与许可见 [第三方声明](DEX-THIRD-PARTY-NOTICES.txt) 和 [third-party](third-party)。
