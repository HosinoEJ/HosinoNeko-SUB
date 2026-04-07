# Cloudflare Workers 部署指南

## 前置要求

1. Cloudflare 账户
2. Node.js 18+ 
3. Wrangler CLI

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 登录 Cloudflare

```bash
npx wrangler login
```

### 3. 创建 D1 数据库

```bash
npx wrangler d1 create hosinoneko-subscribers
```

执行后会返回数据库 ID，复制该 ID 并更新 `wrangler.toml` 文件中的 `database_id`。

### 4. 初始化数据库

```bash
npm run db:init
```

### 5. 配置环境变量

使用 Wrangler 设置敏感环境变量：

```bash
npx wrangler secret put EMAIL_USER
npx wrangler secret put WEBHOOK_SECRET
```

### 6. 本地开发

```bash
npm run dev
```

### 7. 部署到生产环境

```bash
npm run deploy
```

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| EMAIL_USER | 发件人邮箱地址 | your-email@example.com |
| WEBHOOK_SECRET | GitHub Webhook 验证密钥 | your_secret_token |

## 邮件发送配置

本项目使用 MailChannels API 发送邮件，这是 Cloudflare Workers 推荐的免费邮件发送方案。

### MailChannels 配置要求

1. 确保你的域名已添加到 Cloudflare
2. 在域名 DNS 中添加 SPF 记录
3. 在域名 DNS 中添加 DKIM 记录

## 定时任务

项目配置了每 5 分钟运行一次的定时任务，用于清理过期的验证码 token。

## 费用预估

基于 Cloudflare D1 免费方案：

- 每日读取：500万行
- 每日写入：10万行
- 存储空间：5GB

对于订阅系统来说，免费额度完全足够使用。

## 迁移现有数据

如果需要从现有的 `sub.json` 迁移数据到 D1：

1. 导出现有数据
2. 使用 `wrangler d1 execute` 命令导入数据

```bash
npx wrangler d1 execute hosinoneko-subscribers --command="INSERT INTO subscribers (email, firstname, lastname, language, mod_sub) VALUES ('user@example.com', 'First', 'Last', '正體中文', 'true');"
```

## 故障排查

### 邮件发送失败

1. 检查域名是否正确配置 SPF 和 DKIM
2. 确认 EMAIL_USER 环境变量已正确设置
3. 查看 Workers 日志获取详细错误信息

### 数据库连接失败

1. 确认数据库 ID 正确
2. 检查数据库是否已创建
3. 确认 Wrangler 已正确登录

## 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [MailChannels API 文档](https://www.mailchannels.com/developer/)
