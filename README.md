# 融媒 - 圈子文件分享平台

一个优雅完美的无损多媒体文件分享平台，支持用户创建圈子、上传下载视频/音频/图片、文件付费销售等功能。

## 🌟 核心功能

### 用户系统
- **用户注册登录** - 支持OAuth认证，用户可自主注册账号
- **个人中心** - 查看已加入的圈子、上传的文件、收益统计等

### 圈子管理
- **创建圈子** - 用户可创建公开或邀请码圈子
- **成员管理** - 支持邀请、加入、退出、移除成员
- **圈子分类** - 为圈子添加分类标签，方便发现和筛选
- **活动日志** - 记录圈子内的所有关键操作

### 文件管理
- **无损上传下载** - 支持视频、音频、图片的无损上传和下载
- **文件夹组织** - 圈子成员可创建多个文件夹来分类管理文件
- **文件预览** - 支持图片和视频在线预览
- **正规下载** - 使用HTTP Content-Disposition实现浏览器原生下载

### 付费功能
- **图片付费销售** - 上传者可设置图片价格，其他用户购买下载
- **支付方式** - 支持微信支付和支付宝
- **收益分配** - 平台自动抽取0.1%手续费，其余转入上传者账户
- **收益统计** - 用户可查看收入统计、交易历史、提现记录

### 后台管理
- **管理员仪表板** - 仅管理员可访问
- **公告发布** - 发布网站公告和通知
- **用户管理** - 查看用户信息、禁用/注销账号
- **操作日志** - 记录所有管理员操作
- **网站统计** - 查看用户总数、圈子总数、文件总数等

## 🛠️ 技术栈

- **前端** - React 19 + Tailwind CSS 4 + TypeScript
- **后端** - Express 4 + tRPC 11 + Node.js
- **数据库** - MySQL/TiDB + Drizzle ORM
- **文件存储** - AWS S3（支持任何S3兼容存储）
- **认证** - OAuth 2.0
- **UI组件** - shadcn/ui + Radix UI

## 📦 快速开始

### 环境要求
- Node.js 18+
- pnpm 10+
- MySQL 8.0+ 或 TiDB

### 安装依赖
```bash
pnpm install
```

### 配置环境变量
创建 `.env.local` 文件：
```env
DATABASE_URL=mysql://user:password@localhost:3306/circle_share
JWT_SECRET=your_jwt_secret_key
VITE_APP_ID=your_oauth_app_id
OAUTH_SERVER_URL=https://api.oauth.provider.com
VITE_OAUTH_PORTAL_URL=https://oauth.provider.com
```

### 初始化数据库
```bash
pnpm db:push
```

### 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000

### 生产构建
```bash
pnpm build
pnpm start
```

## 📊 数据库架构

### 核心表
- **users** - 用户表
- **circles** - 圈子表
- **circle_members** - 圈子成员表
- **circle_categories** - 圈子分类表
- **folders** - 文件夹表
- **files** - 文件表
- **payment_orders** - 支付订单表
- **user_earnings** - 用户收益表
- **platform_earnings** - 平台收益表
- **announcements** - 公告表
- **admin_logs** - 管理员操作日志表
- **circle_activity_logs** - 圈子活动日志表
- **file_share_links** - 文件分享链接表

## 🔐 安全特性

- **OAuth认证** - 安全的第三方认证
- **权限验证** - 基于角色的访问控制（RBAC）
- **数据加密** - 支付数据和敏感信息加密存储
- **审计日志** - 所有管理操作都有记录
- **文件隔离** - S3存储使用随机路径，防止枚举

## 🌍 中国用户支持

### CDN加速
- 使用国内CDN加速静态资源和API请求
- 支持阿里云OSS、腾讯云COS等国内存储服务

### 支付方式
- 完整支持微信支付和支付宝
- 支持人民币结算

### 域名备案
- 支持自定义域名绑定
- 建议使用已备案的域名

### 网络优化
- 优化API响应时间
- 支持国内服务器部署
- 兼容国内浏览器

## 📝 API文档

### 圈子API
- `circles.create` - 创建圈子
- `circles.list` - 获取圈子列表
- `circles.getPublic` - 获取公开圈子
- `circles.searchByCode` - 通过邀请码搜索圈子
- `circles.join` - 加入圈子
- `circles.leave` - 退出圈子
- `circles.getMembers` - 获取圈子成员
- `circles.removeUser` - 移除成员

### 文件API
- `files.upload` - 上传文件
- `files.list` - 获取文件列表
- `files.delete` - 删除文件
- `files.getDownloadUrl` - 获取下载URL

### 支付API
- `payment.createOrder` - 创建支付订单
- `payment.getOrder` - 查询订单
- `payment.completeOrder` - 完成支付
- `payment.getUserEarnings` - 获取用户收益

### 管理API
- `admin.createAnnouncement` - 发布公告
- `admin.listAnnouncements` - 获取公告列表
- `admin.disableUser` - 禁用用户
- `admin.deleteUser` - 删除用户
- `admin.getAdminLogs` - 获取管理日志

## 🚀 部署指南

### 使用Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### 使用PM2部署
```bash
npm install -g pm2
pnpm build
pm2 start dist/index.js --name "circle-share"
```

### 使用Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://user:password@db:3306/circle_share
    depends_on:
      - db
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: circle_share
    volumes:
      - db_data:/var/lib/mysql
volumes:
  db_data:
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 联系方式

- 官网：https://circle-share.example.com
- 邮箱：support@example.com
- 微信公众号：融媒

## 🎯 路线图

- [ ] 实现前端支付界面
- [ ] 集成第三方支付SDK
- [ ] 添加用户提现功能
- [ ] 实现圈子权限管理
- [ ] 添加文件版本控制
- [ ] 实现圈子通知系统
- [ ] 支持直播功能
- [ ] 添加内容审核系统
