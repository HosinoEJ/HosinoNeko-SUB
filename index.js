const express = require('express');
const nodemailer = require('nodemailer');//郵件
require('dotenv').config();//ENV
const fs = require('fs').promises;
const path = require('path');
const app = express();



app.use(express.json());
// 解析表單數據
app.use(express.urlencoded({ extended: true }));



// 郵件傳送物件
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/webhook', async (req, res) => {//github webhook api處理
    const from_mail = process.env.EMAIL_USER;

    //防止有傻逼盜用token
    const token = req.headers['x-hosino-token'];
    if (token !== process.env.WEBHOOK_SECRET) {
        return res.status(403).send('Forbidden');
    }



    try {
        const { added_files, modified_files, compare } = req.body; // 從 body 拿 compare 連結

        // 1. 處理檔名：只取最後一個斜槓後的內容
        const formatFiles = (filesStr) => {
            if (!filesStr) return [];
            return filesStr.split(',')
                .filter(Boolean)
                .map(path => path.split('/').pop()); // 這裡把路徑修掉
        };

        const added = formatFiles(added_files);
        const modified = formatFiles(modified_files);

        const commitUrl = compare || "https://github.com/HosinoEJ/HosinoEJ";

        console.log('--- 文章更新！ ---');
        console.log('新增:', added);
        console.log('修改:', modified);

        const subscribers = JSON.parse(await fs.readFile('./sub.json', 'utf-8'));

        for (const user of subscribers) {
            try{
                if (user.modSub === "true" && modified.length > 0 ){//發修改資訊
                    console.log(`M mail to ${user.email}`)
                    const fileNames = [...modified].join('、');
                    await transporter.sendMail({
                        from:`"HosinoNeko"<${from_mail}>`,
                        to: user.email,
                        subject: '有修改的文章',
                        html: `<p>${user.lastname}醬！</p>
                            <p>你訂閱的 HosinoNeko 有文章 <b>${fileNames}</b> 有更新，需不需要查看一下修改的具體內容喵？</p>
                            <p>👉 <a href="${commitUrl}">點擊這裡查看詳細修改內容</a></p>
                            <br>
                            <p>祝你有美好的一天喵～🐾</p>
                            <p>你的：HosinoNeko</p>`
                    })
                }
                if (added.length > 0){
                    console.log(`A mail to ${user.email}`)
                    const fileNames = [...added].join('、');
                    await transporter.sendMail({
                        from:`"HosinoNeko"<${from_mail}>`,
                        to: user.email,
                        subject: '有新的文章發佈！',
                        html: `<p>${user.lastname}醬！</p>
                            <p>你訂閱的 HosinoNeko 有新的文章啦： <b>${fileNames}</b></p>
                            <p>👉 <a href="${commitUrl}">點擊這裡查看詳細修改內容</a></p>
                            <br>
                            <p>祝你有美好的一天喵～🐾</p>
                            <p>你的：<a href="hosinoneko.me">HosinoNeko</a></p>`
                    })
                }
            }
            catch(mailError) {
                console.error(`❌ 寄信給 ${user.email} 失敗:`, mailError.message);
            }
        }

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('處理 Webhook 資料時出錯:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/', (req,res) => {
    res.json({ success: true })
})

const port = 3000//process.env.PORT
app.listen(port, '0.0.0.0', () => {
    console.log(`SERVER 運行在 port ${port}`);
});

module.exports = app;
module.exports.handler = serverless(app);
