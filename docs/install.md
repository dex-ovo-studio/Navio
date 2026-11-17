# Windows 安装与升级 / Install and update on Windows

[项目首页 / Home](../README.md) · [Beta 7 发行说明 / Beta 7 release notes](https://github.com/dex-ovo-studio/Navio/releases/tag/v1.0.0-beta.7) · [常见问题 / FAQ](faq.md)

## 选择软件包 / Choose a package

当前公开测试版为 Windows x64 v1.0.0-beta.7。先读[发行说明](https://github.com/dex-ovo-studio/Navio/releases/tag/v1.0.0-beta.7)，再下载[安装版 EXE](https://github.com/dex-ovo-studio/Navio/releases/download/v1.0.0-beta.7/Navio-v1.0.0-beta.7-Windows-x64-setup.exe)或[便携版 ZIP](https://github.com/dex-ovo-studio/Navio/releases/download/v1.0.0-beta.7/Navio-v1.0.0-beta.7-Windows-x64-portable.zip)。

The current Windows x64 public beta is v1.0.0-beta.7. Read the [release notes](https://github.com/dex-ovo-studio/Navio/releases/tag/v1.0.0-beta.7), then download the [EXE installer](https://github.com/dex-ovo-studio/Navio/releases/download/v1.0.0-beta.7/Navio-v1.0.0-beta.7-Windows-x64-setup.exe) or [portable ZIP](https://github.com/dex-ovo-studio/Navio/releases/download/v1.0.0-beta.7/Navio-v1.0.0-beta.7-Windows-x64-portable.zip).

断开后无法联网时，请参阅[恢复 Windows 代理设置](faq.md)。 / If internet access fails after disconnecting, see [how to restore Windows proxy settings](faq.md).

| 软件包 / Package    | 启动方式 / How to start                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 安装版 / Installer  | 校验后运行以 `setup.exe` 结尾的安装包。 / Verify the file and run the installer ending in `setup.exe`.                                 |
| 免安装版 / Portable | 校验后完整解压 ZIP，在解压目录内运行 `Navio.exe`。 / Verify and fully extract the ZIP, then run `Navio.exe` from the extracted folder. |

## 校验 SHA-256 / Verify SHA-256

使用 PowerShell 计算下载文件的 SHA-256，将文件名替换成实际下载的名称。

In PowerShell, replace the example filename with the file you downloaded and calculate its SHA-256.

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '.\Navio-v1.0.0-beta.7-Windows-x64-portable.zip'
```

对照 [Beta 7 的 SHA-256 清单](https://github.com/dex-ovo-studio/Navio/releases/download/v1.0.0-beta.7/SHA256SUMS-rev2.txt)，确认文件名和完整摘要一致。若不一致，请停止运行该文件，从所选 Release 重新下载。

Compare the filename and full digest with the [Beta 7 checksum list](https://github.com/dex-ovo-studio/Navio/releases/download/v1.0.0-beta.7/SHA256SUMS-rev2.txt). If they differ, stop and download the file again from the selected release.

## 升级与恢复 / Update and recovery

1. 备份配置，从系统托盘退出旧版，保存现用安装包或便携目录。 / Back up your settings, quit the old version from the system tray, and keep the previous installer or portable folder.
2. 安装版运行新安装包。便携版解压到新目录，并按该版本说明恢复配置。 / Run the new installer, or extract the portable build to a new folder and restore settings as directed by the release notes.
3. 如需恢复旧版，先完全退出当前版本，再使用已保留的旧版本和对应备份。 / To roll back, quit the current version completely, then use your saved previous build and its matching backup.

如需查看配置目录、连接设置和 TUN 服务说明，请参阅[详细使用指南（中文）](https://github.com/dex-ovo-studio/Navio/blob/main/docs/guide.md)。

See the [full user guide (Chinese)](https://github.com/dex-ovo-studio/Navio/blob/main/docs/guide.md) for configuration folders, connection settings, and the TUN service.
