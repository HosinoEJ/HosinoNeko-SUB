# HosinoNeko Blog Subscription & Notification System

這是一個基於 **Node.js (Express)** 的訂閱管理系統，結合了 **GitHub Actions** 實現自動化的文章更新通知。當你在指定目錄下更新文章時，系統會自動抓取變動並寄信給所有訂閱者。

## 🚀 功能特點

* **訂閱管理**：支援訂閱者資料的新增與更新（存儲於 `sub.json`）。
* **安全驗證**：透過 Email 發送 6 位數驗證碼，確保訂閱者身份真實性。
* **自動化通知**：監控 GitHub 倉庫變動，自動發送新文章發佈或舊文章修改的通知郵件。
* **雙重模組支援**：可區分一般訂閱與特定的「文章修改」追蹤。

---

## 🛠️ 技術棧

* **Backend**: Node.js, Express
* **Templating**: EJS
* **Automation**: GitHub Actions (Workflow)
* **Database**: 檔案式存儲 (`sub.json`)
* **Email**: Nodemailer (SMTP)

---

## 📂 專案結構

* `app.js` (或 `server.js`): 主要的 Express 邏輯與 API 路由。
* `sub.json`: 存放訂閱者名單的 JSON 資料庫。
* `.github/workflows/notify.yml`: GitHub Actions 設定檔。
* `views/`: 存放 `.ejs` 頁面模板。

---

## ⚙️ 環境變數設定 (.env)

在部署前，請確保在根目錄建立 `.env` 檔案並填寫以下資訊：

```env
# 郵件伺服器
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-password

# Webhook 安全密鑰 (需與 GitHub Secrets 一致)
WEBHOOK_SECRET=your_secret_token
```

---

## 🤖 GitHub Actions 配置

為了實現自動化通知，請在 GitHub 倉庫的 **Settings > Secrets and variables > Actions** 中新增：

1.  名稱：`WEBHOOK_SECRET`
2.  值：對應你 `.env` 中的 `WEBHOOK_SECRET`。

### 工作流程說明：
每當 `main` 分支下的 `public/prot/` 目錄有檔案變動時，Workflow 會：
1.  比對 Git Diff 找出新增 (`added`) 與修改 (`modified`) 的檔案清單。
2.  將檔案清單、Commit ID 與比對連結封裝成 JSON。
3.  向你的 API 發送 `POST` 請求，觸發後端寄信邏輯。

---

## ⚓ API 路由參考

| 方法 | 路徑 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/` | 訂閱首頁。 |
| `POST` | `/send-ps-code` | 發送 6 位數驗證碼至使用者信箱。 |
| `GET` | `/subscribe-verify` | 驗證 Token 並取得訂閱者現有資料（自動填充用）。 |
| `POST` | `/subscribe-post` | 提交/更新訂閱資訊。 |
| `POST` | `/api/webhook` | 接收 GitHub Actions 的通知，執行群發郵件任務。 |

---

## 📝 快速啟動

1.  **安裝依賴**：
    ```bash
    npm install
    ```
2.  **初始化資料**：
    確保根目錄有一個 `sub.json`，內容初始化為 `[]`。
3.  **啟動伺服器**：
    ```bash
    node app.js
    ```