# 融媒平台 - 中国用户快速开始指南

欢迎使用融媒平台！本指南帮助中国用户快速上手。

## 🚀 最快开始方式（5分钟）

### 1️⃣ 克隆项目（推荐使用Gitee）
```bash
# 方式一：使用Gitee（最快）
git clone https://gitee.com/jjj555/circle-share.git
cd circle-share

# 方式二：使用GitHub加速
git clone https://ghproxy.com/https://github.com/JJJ555-dev/circle-share.git
cd circle-share
```

### 2️⃣ 安装依赖
```bash
# 配置NPM镜像（可选但推荐）
pnpm config set registry https://registry.npmmirror.com

# 安装依赖
pnpm install
```

### 3️⃣ 配置环境变量
```bash
# 复制示例配置
cp .env.example .env.local

# 编辑配置文件（使用你喜欢的编辑器）
nano .env.local
```

需要配置的关键变量：
```env
# 数据库连接
DATABASE_URL=mysql://user:password@localhost:3306/circle_share

# OAuth配置
VITE_APP_ID=your_oauth_app_id
OAUTH_SERVER_URL=https://api.oauth.provider.com
VITE_OAUTH_PORTAL_URL=https://oauth.provider.com

# JWT密钥
JWT_SECRET=your_jwt_secret_key
```

### 4️⃣ 初始化数据库
```bash
# 推送数据库schema
pnpm db:push
```

### 5️⃣ 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000 即可看到应用！

## 📱 使用Docker快速启动

### 方式一：使用Docker Compose（推荐）
```bash
# 1. 克隆项目
git clone https://gitee.com/jjj555/circle-share.git
cd circle-share

# 2. 启动服务
docker-compose up -d

# 3. 初始化数据库
docker-compose exec app pnpm db:push

# 4. 访问应用
# 打开浏览器访问 http://localhost:3000
```

### 方式二：使用Docker镜像
```bash
# 配置Docker镜像源（可选）
# 编辑 /etc/docker/daemon.json 添加国内镜像源

# 拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/jjj555/circle-share:latest

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://user:password@db:3306/circle_share \
  registry.cn-hangzhou.aliyuncs.com/jjj555/circle-share:latest
```

## 🎯 核心功能演示

### 1. 用户注册和登录
1. 打开应用首页
2. 点击"发现圈子"或"我的圈子"
3. 系统会引导您登录/注册
4. 完成OAuth认证后即可使用

### 2. 创建圈子
1. 登录后点击"我的圈子"
2. 点击"创建圈子"按钮
3. 填写圈子信息：
   - 圈子名称
   - 圈子描述
   - 选择类型：公开或邀请码
   - 添加分类标签
4. 点击"创建"完成

### 3. 上传文件
1. 进入圈子详情页
2. 点击"文件"选项卡
3. 点击"上传文件"按钮
4. 选择文件和目标文件夹
5. 可选：设置文件价格（用于付费销售）
6. 点击"上传"完成

### 4. 下载文件
1. 在圈子详情页查看文件列表
2. 点击文件右侧的"预览"查看文件内容
3. 点击"下载"按钮
4. 如果是付费文件，需要先支付
5. 浏览器会自动下载文件

### 5. 管理文件夹
1. 在圈子详情页点击"文件夹"选项卡
2. 点击"创建文件夹"按钮
3. 输入文件夹名称
4. 可以在上传文件时选择目标文件夹

## 💰 付费功能使用

### 作为卖家（上传付费图片）
1. 上传图片时勾选"设置价格"
2. 输入价格（单位：元）
3. 点击"上传"完成
4. 其他用户购买时会自动转账到你的账户
5. 平台自动抽取0.1%手续费

### 作为买家（购买图片）
1. 找到感兴趣的付费图片
2. 点击"预览"查看图片
3. 点击"下载"按钮
4. 选择支付方式：微信支付或支付宝
5. 完成支付后自动下载

### 查看收益
1. 点击右上角"个人中心"
2. 查看"我的收益"部分
3. 可以看到：
   - 总收入
   - 已提现
   - 可提现余额
4. 点击"提现"可以提取收益到银行卡

## 🔍 发现圈子

### 浏览公开圈子
1. 点击导航栏"发现圈子"
2. 查看所有公开圈子列表
3. 可以按分类筛选
4. 点击圈子卡片查看详情
5. 点击"加入"按钮加入圈子

### 通过邀请码加入
1. 获得圈子的邀请码
2. 点击导航栏的搜索框
3. 输入邀请码
4. 点击"搜索"
5. 找到圈子后点击"加入"

## 👥 圈子成员管理

### 邀请成员
1. 进入你创建的圈子
2. 点击"成员"选项卡
3. 点击"邀请成员"按钮
4. 输入成员的用户名或邮箱
5. 点击"邀请"发送邀请

### 移除成员
1. 在成员列表中找到要移除的成员
2. 点击成员右侧的"移除"按钮
3. 确认移除操作

### 查看成员信息
1. 在成员列表中点击成员名称
2. 可以查看成员的个人信息
3. 可以查看成员上传的文件

## 🔐 账户安全

### 修改密码
1. 点击右上角"个人中心"
2. 点击"账户设置"
3. 点击"修改密码"
4. 输入旧密码和新密码
5. 点击"确认"完成

### 启用双因素认证
1. 在账户设置中找到"安全设置"
2. 点击"启用双因素认证"
3. 扫描二维码或输入密钥
4. 输入验证码确认
5. 保存备用码以防丢失

### 管理登录设备
1. 在账户设置中找到"登录设备"
2. 查看所有登录过的设备
3. 可以远程登出不需要的设备

## 🆘 常见问题

### Q: 如何重置密码？
A: 点击登录页面的"忘记密码"链接，输入邮箱地址，我们会发送重置链接到你的邮箱。

### Q: 如何删除账户？
A: 进入个人中心 > 账户设置 > 高级选项 > 删除账户。注意：删除后无法恢复。

### Q: 上传的文件会被保留多久？
A: 我们永久保留你上传的文件，除非你主动删除。

### Q: 支付失败怎么办？
A: 检查网络连接，确保账户余额充足。如果问题仍未解决，请联系客服。

### Q: 如何举报违规内容？
A: 在文件或圈子上点击"举报"按钮，填写举报原因，我们会在24小时内处理。

### Q: 如何联系客服？
A: 
- 邮箱：support@example.com
- 微信：扫描二维码加入官方群
- 电话：400-XXXX-XXXX

## 📚 更多资源

- **完整文档**：[README.md](README.md)
- **中国部署指南**：[CHINA_SETUP.md](CHINA_SETUP.md)
- **Gitee镜像指南**：[GITEE_MIRROR.md](GITEE_MIRROR.md)
- **API文档**：https://docs.circle-share.example.com
- **GitHub仓库**：https://github.com/JJJ555-dev/circle-share
- **Gitee仓库**：https://gitee.com/jjj555/circle-share

## 🎉 开始使用

现在你已经了解了基本用法，可以开始使用融媒平台了！

如有任何问题，欢迎：
- 提交Issue：https://gitee.com/jjj555/circle-share/issues
- 发送邮件：support@example.com
- 加入微信群：扫描二维码

祝你使用愉快！🚀
