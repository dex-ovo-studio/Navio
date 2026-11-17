<div align="center">

<picture>
  <source media="(max-width: 640px)" srcset=".github/assets/ui/v4/hero-mobile.svg" />
  <img src=".github/assets/ui/v4/hero-desktop.svg" alt="Navio · Windows 网络连接与代理管理 / Network and proxy management for Windows" width="100%" />
</picture>

# Navio

**让连接与日常管理更清晰。**  
_Clearer connections. Simpler everyday management._

Windows x64 · Open source · GPL-3.0-only

[![Latest release](https://img.shields.io/github/v/release/dex-ovo-studio/Navio?display_name=tag&label=Latest%20release)](https://github.com/dex-ovo-studio/Navio/releases)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0--only-blue.svg)](https://github.com/dex-ovo-studio/Navio/blob/main/LICENSE)
[![Issues](https://img.shields.io/github/issues/dex-ovo-studio/Navio)](https://github.com/dex-ovo-studio/Navio/issues)

**[下载 / Downloads](https://github.com/dex-ovo-studio/Navio/releases)** · **[安装指南 / Install](docs/install.md)** · **[常见问题 / FAQ](docs/faq.md)** · **[English](#english)**

</div>

> [!IMPORTANT]
> **下载前请先阅读版本说明。** 以 [GitHub Releases](https://github.com/dex-ovo-studio/Navio/releases) 中实际公开的版本和附件为准。未正式发布的 RC4、RC5、1.0 Stable **不可下载**，本页也不提供这些版本的安装包。
>
> **Beta 7 已知风险：** 断开连接后，Windows 系统代理可能未正确恢复。升级前备份配置；断开连接或退出程序后，请核对 Windows 代理设置与日常联网状态。页面更新不表示此问题已经修复。

## 下载

**[打开 GitHub Releases，选择已公开版本 →](https://github.com/dex-ovo-studio/Navio/releases)**

先阅读所选版本的发行说明与已知问题，再展开 **Assets（附件）**。Beta 7 提供安装版、便携版、源码和 SHA-256 校验资料；其他版本以各自实际附件为准。

- **安装版：** 需要常规 Windows 安装流程时选择此项。
- **Portable / 便携版：** 希望解压后运行时选择此项。请保留同一包内的配套文件。
- **源码附件：** 用于阅读、审计或自行构建。请优先选择发行说明指定的版本与修订源码附件，以及配套的第三方源码附件。Beta 7 对应修订版源码附件（`source-rev2`）及第三方源码附件（`third-party-sources`）。GitHub 自动生成的 **Source code** 压缩包不等于已核验的完整对应源码；源码附件也不是可直接运行的 Windows 应用。
- **SHA-256 校验文件：** 用于核对下载文件的摘要，本身不是安装包。运行前，按同一发布页提供的校验资料核对对应文件。

应用安装包入口指向 Release 列表，供读者选择已公开的版本。

[更新日志与源码 / Changelog and source](CHANGELOG.md) · [项目维护状态](https://github.com/dex-ovo-studio/DEX-Studio-Software-Status)

## 功能范围

- **订阅与节点：** 导入配置，管理订阅和代理组。
- **代理与规则：** 系统代理、TUN 与分流规则，具体支持情况和权限要求以所选版本为准。
- **连接与日志：** 查看连接、流量和运行记录。
- **外观与备份：** 主题设置、配置备份与恢复。

所选版本的功能、权限要求和已知限制见发行说明。

<details>
<summary>品牌与功能示意（非应用截图） / Brand illustration (not an app screenshot)</summary>

此图用于介绍品牌与功能组织，**不是应用运行截图**。本页暂未收录经核验的真实产品截图，实际界面以所选发行版本为准。

This illustration presents the brand and feature layout. **It is not a screenshot of the running app.** This page does not yet include verified product screenshots; the interface may vary by release.

<img src=".github/assets/ui/v2/content.svg" alt="Navio 品牌与功能示意，非应用截图 / Navio brand and feature illustration, not an app screenshot" width="100%" />

</details>

## 使用与支持

- [安装、升级与文件校验](docs/install.md)
- [常见问题](docs/faq.md)
- [详细使用指南](docs/guide.md)
- [问题反馈与功能建议](https://github.com/dex-ovo-studio/Navio/issues)
- [安全报告](https://github.com/dex-ovo-studio/Navio/blob/main/SECURITY.md)
- [贡献指南](https://github.com/dex-ovo-studio/Navio/blob/main/CONTRIBUTING.md)
- [English — 本页英文说明](#english)

Navio **不提供代理线路或订阅服务**。请自行准备合法的配置和服务，并遵守所在地适用规定。

## 开源许可与致谢

Navio 由 **D.E.X Studio** 开发，基于 [Clash Party](https://github.com/mihomo-party-org/clash-party) 和 [Mihomo](https://github.com/MetaCubeX/mihomo)，采用 **GPL-3.0-only** 许可证。

[GPL 许可证](https://github.com/dex-ovo-studio/Navio/blob/main/LICENSE) · [第三方声明](https://github.com/dex-ovo-studio/Navio/blob/main/DEX-THIRD-PARTY-NOTICES.txt) · [项目源码（main）](https://github.com/dex-ovo-studio/Navio/tree/main)

[Beta 7 源码归档](https://github.com/dex-ovo-studio/Navio/releases/download/v1.0.0-beta.7/Navio-v1.0.0-beta.7-source-rev2.zip) · [按版本查找对应源码与校验清单](CHANGELOG.md)

---

## English

Navio is an open-source Windows x64 client for managing network connections, proxy configurations and subscriptions.

**[Published releases](https://github.com/dex-ovo-studio/Navio/releases)** · **[Install and verify](docs/install.md)** · **[FAQ](docs/faq.md)** · **[中文](#navio)**

> [!IMPORTANT]
> **Release status:** Only versions and assets published on [GitHub Releases](https://github.com/dex-ovo-studio/Navio/releases) are available for download. Unreleased RC4, RC5 and 1.0 Stable builds are **not available**. This page does not link to installers for those builds.
>
> **Beta 7 advisory:** The Windows system proxy may not be restored correctly after disconnecting. Back up your configuration before upgrading, and check Windows proxy settings and normal internet access after disconnecting or exiting Navio. A homepage update does not mean this issue has been fixed.

### Choose your download

Open the [release index](https://github.com/dex-ovo-studio/Navio/releases), read the selected release's notes and known issues, then expand **Assets**. Beta 7 includes an installer, a portable package, source archives and SHA-256 checksums. Check the actual assets for any other release.

- **Installer:** Choose this for a standard Windows installation.
- **Portable:** Choose this to extract and run the app. Keep the files from the package together.
- **Source assets:** For review, auditing or building the app yourself. Use the version and revision specified in the release notes, together with the accompanying third-party sources. For Beta 7, choose the revised source asset (`source-rev2`) and the third-party source asset (`third-party-sources`). GitHub's automatically generated **Source code** archives are not equivalent to verified complete corresponding source. Source archives are not ready-to-run Windows applications.
- **SHA-256 file:** Use this to verify the matching download before running it. The checksum file itself is not an installer.

The application download links lead to the release index, where you can choose a published version.

[Changelog and source](CHANGELOG.md) · [Maintenance status](https://github.com/dex-ovo-studio/DEX-Studio-Software-Status)

### Feature scope

- Import configurations and manage subscriptions, nodes and proxy groups.
- Manage system proxy settings, TUN and routing rules where supported by the selected release.
- View connections, traffic and application logs.
- Customize themes and back up or restore configurations.

Check the release notes for availability, required permissions and known limitations.

### Documentation and support

[Install and verify](docs/install.md) · [FAQ](docs/faq.md) · [Full user guide (Chinese)](docs/guide.md) · [Bug reports and feature requests](https://github.com/dex-ovo-studio/Navio/issues) · [Security reports](https://github.com/dex-ovo-studio/Navio/blob/main/SECURITY.md) · [Contributing](https://github.com/dex-ovo-studio/Navio/blob/main/CONTRIBUTING.md)

Navio **does not provide proxy servers or subscriptions**. Supply your own lawful configuration and service, and follow applicable local requirements.

### License and credits

Developed by **D.E.X Studio**, Navio is based on [Clash Party](https://github.com/mihomo-party-org/clash-party) and [Mihomo](https://github.com/MetaCubeX/mihomo). It is licensed under **GPL-3.0-only**.

[License](https://github.com/dex-ovo-studio/Navio/blob/main/LICENSE) · [Third-party notices](https://github.com/dex-ovo-studio/Navio/blob/main/DEX-THIRD-PARTY-NOTICES.txt) · [Project source (main)](https://github.com/dex-ovo-studio/Navio/tree/main)

[Beta 7 source archive](https://github.com/dex-ovo-studio/Navio/releases/download/v1.0.0-beta.7/Navio-v1.0.0-beta.7-source-rev2.zip) · [Source archives and checksums by version](CHANGELOG.md)

---

<div align="center">
<sub>© 2026 D.E.X Studio · Navio · GPL-3.0-only</sub>
</div>
