# 融媒平台 - 中国用户部署指南

本指南帮助中国用户快速部署和使用融媒平台。

## 🌐 网络优化

### 使用国内CDN
推荐使用以下国内CDN服务：

#### 阿里云CDN
```bash
# 配置阿里云OSS存储
export ALIYUN_ACCESS_KEY_ID=your_access_key
export ALIYUN_ACCESS_KEY_SECRET=your_secret
export ALIYUN_OSS_BUCKET=your_bucket
export ALIYUN_OSS_REGION=oss-cn-beijing
```

#### 腾讯云COS
```bash
# 配置腾讯云COS存储
export TENCENT_SECRET_ID=your_secret_id
export TENCENT_SECRET_KEY=your_secret_key
export TENCENT_COS_BUCKET=your_bucket
export TENCENT_COS_REGION=ap-beijing
```

#### 七牛云
```bash
# 配置七牛云存储
export QINIU_ACCESS_KEY=your_access_key
export QINIU_SECRET_KEY=your_secret_key
export QINIU_BUCKET=your_bucket
export QINIU_DOMAIN=your_domain
```

### 国内服务器部署
推荐使用以下国内云服务商：

| 云服务商 | 推荐地区 | 特点 |
|---------|--------|------|
| 阿里云 | 华东1（杭州）、华北2（北京） | 性能稳定，生态完整 |
| 腾讯云 | 华东地区（上海）、华北地区（北京） | 价格优惠，服务完善 |
| 华为云 | 华东-上海、华北-北京 | 企业级服务，安全可靠 |
| 百度智能云 | 华北-北京、华东-苏州 | AI能力强，成本低 |
| 金山云 | 华东-杭州、华北-北京 | 游戏优化，性能好 |

## 💳 支付配置

### 微信支付
```bash
# 微信支付配置
export WECHAT_APPID=your_app_id
export WECHAT_MCH_ID=your_mch_id
export WECHAT_API_KEY=your_api_key
export WECHAT_CERT_PATH=/path/to/cert.pem
export WECHAT_KEY_PATH=/path/to/key.pem
```

### 支付宝
```bash
# 支付宝配置
export ALIPAY_APPID=your_app_id
export ALIPAY_PRIVATE_KEY=your_private_key
export ALIPAY_PUBLIC_KEY=your_public_key
export ALIPAY_NOTIFY_URL=https://your_domain/api/alipay/notify
```

## 📱 ICP备案

### 备案流程
1. **准备材料**
   - 企业营业执照
   - 法人身份证
   - 域名证书
   - 服务器信息

2. **选择备案商**
   - 阿里云备案
   - 腾讯云备案
   - 华为云备案

3. **提交备案**
   - 在云服务商后台提交备案申请
   - 等待初审（1-2天）
   - 提交至工信部（10-20天）
   - 获得ICP备案号

### 备案后配置
```bash
# 在网站底部添加备案号
export ICP_NUMBER=京ICP备2024000000号
export ICP_LINK=https://beian.miit.gov.cn
```

## 🔒 安全合规

### 内容安全
- 集成阿里云内容安全API进行内容审核
- 支持图片、视频、文本内容检测

```bash
export ALIYUN_CONTENT_SAFETY_KEY=your_key
export ALIYUN_CONTENT_SAFETY_ENDPOINT=your_endpoint
```

### 隐私政策
- 制定符合《个人信息保护法》的隐私政策
- 明确数据收集、使用、保护方式
- 提供用户数据导出和删除功能

### 用户协议
- 制定清晰的服务条款
- 明确用户权利和义务
- 说明违规内容处理方式

## 🚀 快速部署

### 使用阿里云ECS部署
```bash
# 1. 购买ECS实例（推荐配置）
# - 地区：华东1（杭州）
# - 实例类型：ecs.t5.large
# - 操作系统：Ubuntu 22.04 LTS
# - 存储：100GB SSD

# 2. 连接到服务器
ssh -i your_key.pem ubuntu@your_server_ip

# 3. 安装依赖
sudo apt update
sudo apt install -y nodejs npm mysql-server

# 4. 安装pnpm
npm install -g pnpm

# 5. 克隆项目
git clone https://github.com/your_username/circle-share.git
cd circle-share

# 6. 安装项目依赖
pnpm install

# 7. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入数据库和支付信息

# 8. 初始化数据库
pnpm db:push

# 9. 构建项目
pnpm build

# 10. 启动服务
pm2 start dist/index.js --name "circle-share"
pm2 save
pm2 startup
```

### 使用腾讯云CVM部署
```bash
# 1. 购买CVM实例（推荐配置）
# - 地区：华东地区（上海）
# - 实例类型：标准型S5
# - 操作系统：Ubuntu 22.04 LTS
# - 存储：100GB SSD

# 2. 配置安全组
# - 开放80端口（HTTP）
# - 开放443端口（HTTPS）
# - 开放3000端口（应用）
# - 开放3306端口（数据库，仅内网）

# 3. 后续步骤同阿里云部署
```

### 使用Docker Compose快速部署
```bash
# 1. 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. 克隆项目
git clone https://github.com/your_username/circle-share.git
cd circle-share

# 3. 配置环境变量
cp .env.example .env.local

# 4. 启动服务
docker-compose up -d

# 5. 初始化数据库
docker-compose exec app pnpm db:push
```

## 📊 性能优化

### 数据库优化
```sql
-- 创建索引以提高查询性能
CREATE INDEX idx_circles_creator ON circles(creatorId);
CREATE INDEX idx_files_circle ON files(circleId);
CREATE INDEX idx_files_uploader ON files(uploaderId);
CREATE INDEX idx_payment_orders_buyer ON payment_orders(buyerId);
CREATE INDEX idx_payment_orders_seller ON payment_orders(sellerId);
CREATE INDEX idx_user_earnings_user ON user_earnings(userId);
```

### 缓存配置
```bash
# 使用Redis缓存
export REDIS_URL=redis://localhost:6379
export CACHE_TTL=3600
```

### 图片优化
- 使用阿里云图片处理服务
- 自动生成缩略图
- 支持多种格式转换

```bash
export ALIYUN_IMAGE_PROCESSING=true
export ALIYUN_IMAGE_STYLE=image/resize,w_200,h_200
```

## 🔧 监控和日志

### 使用阿里云日志服务
```bash
export ALIYUN_LOG_PROJECT=your_project
export ALIYUN_LOG_STORE=your_store
export ALIYUN_LOG_ENDPOINT=your_endpoint
```

### 使用ELK Stack本地部署
```yaml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    ports:
      - "5000:5000"
```

## 📞 技术支持

- 官方文档：https://docs.circle-share.example.com
- 问题反馈：https://github.com/your_username/circle-share/issues
- 微信交流群：[扫描二维码加入]
- 邮件支持：support@example.com

## 🎯 常见问题

### Q: 如何选择合适的云服务商？
A: 根据以下因素选择：
- 预算：腾讯云和百度云性价比较高
- 性能：阿里云和华为云性能稳定
- 支持：选择有中文支持的服务商

### Q: 支付宝和微信支付哪个更好？
A: 两者都很好，建议同时支持：
- 微信支付：用户基数大，支付体验好
- 支付宝：企业用户多，结算更快

### Q: 如何保证用户隐私？
A: 采取以下措施：
- 使用HTTPS加密传输
- 数据库加密存储
- 定期安全审计
- 遵守《个人信息保护法》

### Q: 如何处理违规内容？
A: 建立内容审核体系：
- 自动审核：使用阿里云内容安全API
- 人工审核：建立审核团队
- 用户举报：提供举报功能
- 快速处理：及时下架违规内容

## 📚 参考资源

- [工业和信息化部ICP备案](https://beian.miit.gov.cn)
- [个人信息保护法](http://www.npc.gov.cn)
- [网络安全法](http://www.npc.gov.cn)
- [阿里云文档](https://help.aliyun.com)
- [腾讯云文档](https://cloud.tencent.com/document)
