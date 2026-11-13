# fc-certbot

此版本已合并 Python 3.12、Certbot 5.10.0、CAS SDK 3.9.5、AliDNS SDK 4.6.1 和新版 cryptography 的兼容修改。

- [完整项目部署说明](src/readme.md)
- [证书生成器配置与本地验证](src/cert-generator/README.md)
- [Serverless Devs 部署配置](src/s.yaml)

使用本地 `src/s.yaml` 部署前，填写访问配置、RAM 角色、函数名与 `certbotEmail`。杭州和新加坡均已配置 Python 3.12 依赖构建及 Node.js 26 域名管理函数依赖安装。
