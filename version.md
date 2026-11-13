## 0.1.0

- 以 fc-certbot-ng 维护，基于 devsapp/fc-certbot。
- 使用 Python 3.12、Node.js 20、Certbot 5.10.0 及新版阿里云 SDK。
- 使用 cryptography 转换 RSA 私钥，兼容 PKCS#8 与 PKCS#1。
- 支持 com.cn、co.uk 等多段后缀，修复通配符证书续期。
- 部署配置通过环境变量传入，兼容应用中心的旧版 npm。
- src 通过子模块引用公开的 fc-certbot-src 仓库。
