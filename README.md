# fc-certbot-ng

[![Compatibility tests](https://github.com/SmallKi-d/fc-certbot-ng/actions/workflows/test.yml/badge.svg)](https://github.com/SmallKi-d/fc-certbot-ng/actions/workflows/test.yml)
![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Node.js 20](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)

运行在阿里云函数计算上的 Let's Encrypt 证书签发与自动轮换工具。基于 [devsapp/fc-certbot](https://github.com/devsapp/fc-certbot)，适配 Python 3.12、Node.js 20、新版阿里云 SDK 和 cryptography 私钥处理接口。

通过 AliDNS 完成 DNS-01 验证，将证书上传到数字证书管理服务 CAS；定时检查由本应用管理的 FC 自定义域名，在证书到期前七天内续签并更新绑定。

## 版本支持

| 组件 | 版本 |
| --- | --- |
| 证书生成函数 | Python 3.12 |
| 域名管理函数 | Node.js 20（FC 托管运行时 `nodejs20`） |
| Certbot / ACME | 5.10.0 |
| CAS Python SDK | 3.9.5 |
| AliDNS Python SDK | 4.6.1 |
| cryptography / PyOpenSSL | 50.0.2 / 26.4.0 |

- 使用 cryptography 读取 PKCS#8 / PKCS#1 RSA PEM 并转换为 CAS 上传格式。
- 通过 AliDNS 查询主域名，支持 `example.com.cn`、`example.co.uk`、子域名及通配符。
- 每次函数调用刷新 RAM 角色临时凭证，并传递给 DNS hook。
- 杭州与新加坡分别部署，依赖构建兼容应用中心旧 npm。
- 通过部署环境变量配置角色与邮箱。

## 仓库结构

本仓库维护项目介绍、模板元数据和兼容性 CI。`src/` 是指向 [SmallKi-d/fc-certbot-src](https://github.com/SmallKi-d/fc-certbot-src) 的 Git 子模块，固定到经过验证的源码提交。

```text
fc-certbot-ng/
├── publish.yaml       # 模板元数据
├── .github/workflows/ # Python 3.12 / Node.js 20 验证
└── src/               # 子模块：fc-certbot-src
    ├── s.yaml
    ├── cert-generator/
    └── fc-domain-manager/
```

## 部署

在阿里云应用中心通过 Git 仓库部署时，直接选择 **[fc-certbot-src](https://github.com/SmallKi-d/fc-certbot-src)**，部署清单使用仓库根目录的 `s.yaml`。这样不依赖构建器对子模块的支持。

在应用中心的**流水线环境变量**中配置：

| 变量 | 说明 |
| --- | --- |
| `FC_CERTBOT_ROLE_ARN` | 完整 RAM 角色 ARN：`acs:ram::账号ID:role/角色名` |
| `CERTBOT_EMAIL` | Let's Encrypt 账号邮箱 |

角色需要 AliDNS、CAS 和 FC 相关权限。变量必须对运行 `s deploy` 的构建进程可见。可选的访问配置别名和函数名见 [源码部署说明](https://github.com/SmallKi-d/fc-certbot-src#部署与配置)。

本地部署需要 Linux、Python 3.12、Node.js 20 和 Serverless Devs v3：

```bash
git clone --recurse-submodules https://github.com/SmallKi-d/fc-certbot-ng.git
cd fc-certbot-ng/src
cp .env.example .env
# 编辑 .env，填写 RAM 角色 ARN 和邮箱
PYTHON_BIN=python3.12 s deploy -y
```

已有克隆可执行 `git submodule update --init --recursive` 获取源码；维护者可使用 `git submodule update --remote src` 更新引用，并提交新的子模块版本。

## 签发证书

部署完成后调用杭州地域的 `cert-generator` 函数：

```json
{"domainName": "example.com.cn"}
```

通配符示例：`{"domainName": "*.example.com.cn"}`。域名需托管在当前账号的阿里云 DNS。证书上传 CAS 后，可绑定到 FC 自定义域名；保留自动生成的 `devs-certbot-generated-` 证书名，定时任务会识别并维护这些证书。

## 开发与验证

```bash
cd src/cert-generator
PYTHON_BIN=python3.12 bash scripts/build-deps.sh
PYTHONPATH=python python3.12 -m unittest discover -s tests -v
cd ../fc-domain-manager
npm ci --omit=dev
npm test
```

测试使用真实 SDK 模型和加密库，模拟云端请求。真实签发需要账号权限及可验证域名。模板注册表发布工作流保留为手动触发；Git 仓库部署不需要发布模板。

## 致谢

本项目延续 [devsapp/fc-certbot](https://github.com/devsapp/fc-certbot) 的证书签发与 FC 域名轮换设计。问题反馈请提交到 [fc-certbot-ng Issues](https://github.com/SmallKi-d/fc-certbot-ng/issues)。
