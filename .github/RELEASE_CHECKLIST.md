# Windows 发行核对

`main` 上的 **Desktop checks** 验证锁定依赖、格式、Lint、类型、Windows 单元测试、打包脚本、桌面源码编译及对应源码归档。CI 摘要中的 SHA-256 对应当次提交生成的 tar。发行时应另外计算最终交付文件的 SHA-256。

1. 记录候选提交完整 SHA、版本、用于恢复的上一版本 tag / SHA。确认该候选的 CI 通过且 05 已完成集成审查。
2. 按 [Windows 构建说明](../DEX-BUILD.txt) 从干净候选提交构建 setup 和 portable 到新目录。核对参考包 SHA-256，保留构建记录及运行资源来源。使用 `node scripts/verify-release-windows.cjs <产物目录>` 校验两个文件的名称、大小及 SHA-256 与清单一致。签署或改动文件后重新生成清单，再重复校验。
3. 记录同一提交的 GPL 对应源码归档及 SHA-256。核对 [第三方说明](../DEX-THIRD-PARTY-NOTICES.txt)、[第三方源码清单](../third-party/SOURCE-ARCHIVES.json) 和最终包内文件。对每个分发运行组件确认来源、许可、许可文本及所需对应源码。CI 的文件存在性检查仅覆盖归档完整性。
4. 在隔离的 Windows 环境对相同 setup / portable 验证启动、升级与配置保留、退出与代理恢复。写明版本、候选文件 SHA-256、测试结果及未通过项。
5. 由 05 核对证据。公开发行须经明确授权。发布后抽查公开下载和对应源码链接的文件摘要，并在发行记录中保留恢复引用。

建议在 GitHub 为 `main` 要求通过 Pull Request 集成，并在 Windows CI 成功运行后选定实际显示的检查名称作为必过项。保留线性与合并历史的现行约定，限制强制推送及删除。为 `showcase` 保留独立的主页审查。仓库设置变更单独审查。
