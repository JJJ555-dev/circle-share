# 融媒平台 - Gitee镜像配置指南

为了方便中国用户访问和下载，我们在Gitee上维护了完整的镜像仓库。

## 🚀 Gitee镜像仓库

- **GitHub仓库**：https://github.com/JJJ555-dev/circle-share
- **Gitee镜像**：https://gitee.com/jjj555/circle-share

## 📥 从Gitee克隆项目

### 方式一：直接克隆
```bash
git clone https://gitee.com/jjj555/circle-share.git
cd circle-share
pnpm install
```

### 方式二：使用镜像加速
```bash
# 使用GitHub加速镜像
git clone https://ghproxy.com/https://github.com/JJJ555-dev/circle-share.git

# 或使用Gitee镜像
git clone https://gitee.com/jjj555/circle-share.git
```

## 🔄 同步更新

Gitee镜像会定期与GitHub同步更新。如果您发现镜像版本不是最新，可以：

1. **手动同步**
   - 访问Gitee仓库页面
   - 点击"同步"按钮
   - 选择"强制同步"

2. **自动同步**
   - 我们已配置GitHub Actions自动同步
   - 每天凌晨2点自动同步一次
   - 新版本发布时立即同步

## 📦 国内镜像加速

### GitHub加速镜像
如果GitHub访问缓慢，可以使用以下加速镜像：

| 镜像站点 | 地址 | 特点 |
|---------|------|------|
| ghproxy | https://ghproxy.com | 稳定可靠，支持raw文件 |
| fastgit | https://raw.fastgit.org | 速度快，支持多种格式 |
| 阿里镜像 | https://mirrors.aliyun.com | 国内节点，速度快 |
| 清华镜像 | https://mirrors.tuna.tsinghua.edu.cn | 学术机构，稳定 |

### 使用加速镜像克隆
```bash
# 使用ghproxy加速
git clone https://ghproxy.com/https://github.com/JJJ555-dev/circle-share.git

# 使用fastgit加速
git clone https://raw.fastgit.org/JJJ555-dev/circle-share.git

# 直接使用Gitee（推荐）
git clone https://gitee.com/jjj555/circle-share.git
```

## 🐳 Docker镜像

### 从国内镜像源拉取Docker镜像
```bash
# 使用阿里云镜像源
docker pull registry.cn-hangzhou.aliyuncs.com/jjj555/circle-share:latest

# 使用腾讯云镜像源
docker pull ccr.ccs.tencentyun.com/jjj555/circle-share:latest

# 使用网易云镜像源
docker pull hub.c.163.com/jjj555/circle-share:latest
```

### 配置Docker镜像加速
编辑 `/etc/docker/daemon.json`：
```json
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://registry.aliyuncs.com",
    "https://hub-mirror.c.163.com"
  ]
}
```

重启Docker：
```bash
sudo systemctl restart docker
```

## 📚 NPM包加速

### 使用国内NPM镜像
```bash
# 使用淘宝NPM镜像
npm config set registry https://registry.npmmirror.com

# 使用腾讯云NPM镜像
npm config set registry https://mirrors.cloud.tencent.com/npm

# 使用华为云NPM镜像
npm config set registry https://mirrors.huaweicloud.com/repository/npm

# 使用阿里云NPM镜像
npm config set registry https://registry.aliyuncs.com
```

### 使用pnpm加速
```bash
# 配置pnpm镜像
pnpm config set registry https://registry.npmmirror.com

# 查看配置
pnpm config get registry
```

## 🔗 CDN加速下载

### 使用jsDelivr CDN
```bash
# 下载项目文件
curl https://cdn.jsdelivr.net/gh/JJJ555-dev/circle-share@main/README.md

# 或使用Gitee CDN
curl https://gitee.com/jjj555/circle-share/raw/main/README.md
```

## 🌐 国内DNS配置

如果访问GitHub缓慢，可以配置国内DNS：

### Linux/Mac配置
编辑 `/etc/hosts`：
```
# GitHub加速
199.232.69.194 github.global.ssl.fastly.net
140.82.113.4 github.com
151.101.1.140 raw.githubusercontent.com
151.101.65.140 raw.githubusercontent.com
151.101.129.140 raw.githubusercontent.com
151.101.193.140 raw.githubusercontent.com
```

### Windows配置
编辑 `C:\Windows\System32\drivers\etc\hosts`：
```
# 同上
```

## 📞 问题反馈

如果遇到镜像同步问题或访问困难，请：

1. **提交Issue**
   - GitHub：https://github.com/JJJ555-dev/circle-share/issues
   - Gitee：https://gitee.com/jjj555/circle-share/issues

2. **发送邮件**
   - support@example.com

3. **加入微信群**
   - 扫描二维码加入官方交流群

## 🎯 推荐方案

对于中国用户，我们推荐以下方案：

### 方案一：最快速度（推荐）
```bash
# 1. 使用Gitee克隆
git clone https://gitee.com/jjj555/circle-share.git

# 2. 配置NPM镜像
pnpm config set registry https://registry.npmmirror.com

# 3. 安装依赖
pnpm install

# 4. 启动开发
pnpm dev
```

### 方案二：使用Docker
```bash
# 1. 配置Docker镜像源
# 编辑 /etc/docker/daemon.json

# 2. 拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/jjj555/circle-share:latest

# 3. 运行容器
docker run -p 3000:3000 registry.cn-hangzhou.aliyuncs.com/jjj555/circle-share:latest
```

### 方案三：使用GitHub加速
```bash
# 1. 使用ghproxy加速
git clone https://ghproxy.com/https://github.com/JJJ555-dev/circle-share.git

# 2. 其他步骤同方案一
```

## 📊 速度对比

| 方案 | 克隆速度 | 安装速度 | 总耗时 |
|-----|--------|--------|-------|
| Gitee直接 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 5-10分钟 |
| GitHub+ghproxy | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 10-15分钟 |
| GitHub直接 | ⭐⭐ | ⭐⭐⭐ | 30-60分钟 |

## 🚀 持续集成

我们使用GitHub Actions进行自动化测试和部署：

- **自动测试**：每次提交都运行测试套件
- **自动构建**：成功的提交自动构建Docker镜像
- **自动同步**：每天自动同步到Gitee镜像
- **自动发布**：新版本自动发布到NPM和Docker Hub

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📞 联系方式

- 官网：https://circle-share.example.com
- GitHub：https://github.com/JJJ555-dev/circle-share
- Gitee：https://gitee.com/jjj555/circle-share
- 邮箱：support@example.com
- 微信：扫描二维码加入官方群
