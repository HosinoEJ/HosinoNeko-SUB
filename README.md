# HosinoNeko Blog Subscription & Notification System

![AI Generated Content](https://img.shields.io/badge/AI-Generated-blue)

這是一個基於 **Node.js (Express)** 的訂閱管理系統，結合了 **GitHub Actions** 與 **Google Sheets API** 實現自動化的文章更新通知。當你在指定目錄下更新文章時，系統會自動抓取變動並透過 SMTP 寄信給所有訂閱者。

---

## 🚀 功能特點

*   **雲端名單管理**：捨棄本地 JSON，改用 **Google Sheets** 管理訂閱者名單，方便隨時編輯。
*   **安全驗證**：透過 `x-hosino-token` 驗證 Webhook 來源，確保 API 安全性。
*   **自動化通知**：監控 GitHub 倉庫變動，自動發送新文章發佈或舊文章修改的通知郵件。
*   **高效發送**：採用異步併發處理郵件任務，縮短大規模發送的等待時間。
*   **擬人化通知**：內建親切的「喵」語氣模板，增加與讀者的互動感。

---

## 🛠️ 技術棧

*   **Runtime**: Node.js 18+
*   **Framework**: Express
*   **Database**: Google Sheets (via Google Apps Script JSON API)
*   **Automation**: GitHub Actions
*   **Email Service**: Nodemailer (SMTP)

---

## 📂 專案結構

*   `app.js`: 主要的 Express 邏輯、GAS 資料抓取與郵件發送邏輯。
*   `.env`: 環境變數設定（不進入版本控制）。
*   `.github/workflows/notify-api.yml`: GitHub Actions 工作流設定。(目標倉庫)

---

## ⚙️ 環境變數設定 (.env)

請在根目錄建立 `.env` 檔案並填入以下資訊：
```env
# 伺服器設定
PORT=3000#(目前程式碼寫死 3000，但建議保留此項以便日後擴充)
#DEV_MODE=false#開發模式，默認關閉

# SMTP 郵件伺服器設定
# 如果使用 Gmail，host 通常是 smtp.gmail.com，port 是 465 (secure: true)
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true

# 寄件人信箱與密碼 (密碼通常是 App Specific Password)
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-password-here

# GitHub Webhook 安全驗證 Token
# 這要對應你 GitHub Repo 設定中的 Secret，或是傳送 header 'x-hosino-token' 的內容，他們必須是純隨機的，你可以讓工具給你隨機生成一個，或者你在鍵盤上狂敲一頓
WEBHOOK_SECRET=your_super_secret_token_here

GAS_URL=你的Google AppScript地址
```

---

## 🤖 GitHub Actions 配置

請在 GitHub 倉庫的 **Settings > Secrets and variables > Actions** 中新增 `WEBHOOK_SECRET`，並確保 `notify-api.yml` 監控正確的路徑：

```yaml
on:
  push:
    # 處理在哪一個分支下的分支
    branches:
      - main
    # 這個路徑下的檔案變動時，觸發 Workflow
    paths:
      - 'Blog/**'
  workflow_dispatch:

env:
  TARGET_DIR: "Blog/"
  WEBHOOK_URL: "https://project-name.vercel.app"
```

---

## ⚓ API 路由參考

| 方法 | 路徑 | 說明 |
| :--- | :--- | :--- |
| `GET` | `/` | 系統存活檢查。 |
| `POST` | `/api/webhook` | 接收 GitHub 變動資訊，從 GAS 抓取名單並執行群發任務。 |
| `GET` | `/test-mail` | SMTP 功能測試接口。 |

---

## 📝 快速啟動

1.  **安裝依賴**：
    ```bash
    npm install
    ```
2.  **部署 Google Apps Script**：
    將專屬的 GAS 腳本部署為 Web App，並將 URL 填入 `.env`。
3.  **啟動伺服器**：
    ```bash
    node index.js
    ```

---