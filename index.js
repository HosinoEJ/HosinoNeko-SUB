const express = require('express');
const nodemailer = require('nodemailer');//郵件
require('dotenv').config();//ENV
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

        const added = path.parse(formatFiles(added_files)).name;
        const modified = path.parse(formatFiles(modified_files)).name;

        const commitUrl = compare || "https://github.com/HosinoEJ/HosinoNeko-SUB-SEND";

        console.log('--- 文章更新！ ---');
        console.log('新增:', added);
        console.log('修改:', modified);

        //const subPath = path.join(process.cwd(), 'sub.json');
        //const subscribers = JSON.parse(await fs.readFile(subPath, 'utf-8'));
        const GAS_URL = process.env.GAS_URL;
        console.log('正在從 Google Sheets 獲取訂閱名單...');
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error('無法獲取訂閱名單');
        const subscribers = await response.json();
        console.log(`找到 ${subscribers.length} 位訂閱者`);

        for (const user of subscribers) {
            try{
                if (user.modSub == true && modified.length > 0 ){//發修改資訊
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

app.get('/test-mail', async (req, res) => {
    try {
        if(process.env.DEV_MODE === 'true'){
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, // 寄給自己
                subject: 'SMTP 測試',
                text: '如果你看到這封信，代表 SMTP 設定成功了喵！'
            });
            res.send('測試信已發送！');
        }
        else{res.send('<h1>我操你媽，我操死你血媽</h1><p>操死你的嗎就你他媽的知道這個路由唄，想刷存在感的給我滾遠點</p><p>喔，你忘了在.env中加DEV_MODE=true嗎，那沒..<b>操你媽活該被駡</b></p>')}//上綫後如果有傻逼進入到了這個路由，防止開發者郵箱被塞爆
    } catch (err) {
        res.status(500).send('發送失敗: ' + err.message);
    }
});

app.get('/', (req,res) => {
    res.json({ success: true, by: "HosinoNeko" })
})

if (process.env.NODE_ENV !== 'production') {
    const port = 3000;
    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 本地測試運行在 port ${port}`);
    });
}
//<--LINE 115
module.exports = app;