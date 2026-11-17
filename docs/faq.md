# 常见问题 / FAQ

[项目首页 / Home](../README.md) · [安装指南 / Installation](install.md) · [更新日志 / Changelog](../CHANGELOG.md)

## 到哪里下载和查找源码？ / Where are downloads and source?

从 [Beta 7 发行页](https://github.com/dex-ovo-studio/Navio/releases/tag/v1.0.0-beta.7)下载当前 Windows x64 公开测试版。发行说明列有校验、对应源码和许可资料；安装步骤见[安装指南](install.md)。

Download the current Windows x64 public beta from the [Beta 7 release page](https://github.com/dex-ovo-studio/Navio/releases/tag/v1.0.0-beta.7). The release notes list checksums, corresponding source archives, and license materials. See the [installation guide](install.md) for setup steps.

## Beta 7 断开后为什么仍有系统代理？ / Why is the system proxy still set after disconnecting in Beta 7?

Beta 7 断开后有时会保留 Windows 系统代理。连接前记下原代理设置。若断开后无法联网，先从托盘退出 Navio，再到 Windows **设置 → 网络和 Internet → 代理**恢复原设置，然后检查能否联网。

Beta 7 may leave the Windows system proxy in place after disconnecting. Note your proxy settings before connecting. If internet access fails after disconnecting, quit Navio from the system tray, restore your previous settings under **Settings → Network & internet → Proxy**, and check your connection.

## 没有可用节点怎么办？ / What if no nodes are available?

确认导入的是有效配置，刷新订阅后重新选择代理组和节点。请使用自己有权使用的订阅或配置。

Check that the imported profile is valid, refresh it, and select a proxy group and node again. Supply a profile or subscription you are authorized to use.

## 如何反馈问题？ / How do I report a problem?

到 [Issues](https://github.com/dex-ovo-studio/Navio/issues) 提供 Navio 版本、Windows 版本、安装或便携方式、复现步骤和预期结果。发布日志或截图前移除订阅链接、密码、令牌及账号信息。安全问题请按[私密报告流程](https://github.com/dex-ovo-studio/Navio/blob/main/SECURITY.md)提交。

Use Issues for the Navio and Windows versions, installer or portable mode, reproduction steps, and the expected result. Remove subscription links, passwords, tokens, and account details from logs or screenshots. Follow the private reporting process for security issues.
