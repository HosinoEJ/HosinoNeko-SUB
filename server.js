const express = require('express');
const crypto = require('crypto');//加密吧朋友（bushi
const nodemailer = require('nodemailer');//郵件
require('dotenv').config();//ENV
const fs = require('fs').promises;
const path = require('path');
const app = express();

let tempTokens = {};//存放token
// 每 5 分鐘檢查一次，刪除已過期的 Token
setInterval(() => {
    const now = Date.now();
    for (const token in tempTokens) {
        if (tempTokens[token].expires < now) {
            delete tempTokens[token];
            console.log(`Token ${token} 已過期並清理`);
        }
    }
}, 300000);



// 郵件傳送物件
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


app.use(express.json());
app.set('view engine' , 'ejs');
app.use(express.static('public'));
// 解析表單數據
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {//主路由
    const data = {
        title: 'Subscribe',
        message: 'Subscribe my BLOG!',
        items: ['Node.js', 'Express', 'EJS']
    };
    // 渲染 views/index.ejs 傳入 data
    res.render('index', data);
});




app.get('/subscribe', async (req, res) => {
    const { mail, token } = req.query;

    if (!token) {
        return res.render('subscribe', { user: {}, message: '' });
    }

    // 驗證 Ps Code (token)
    if (tempTokens[token] === mail) {
        const subs = JSON.parse(await fs.readFile('./sub.json', 'utf8'));
        const user = subs.find(u => u.email === mail);
        
        delete tempTokens[token]; // 用完即毀

        // 如果是 Fetch 請求，回傳 JSON 資料讓前端自動填充
        if (req.headers['x-requested-with'] === 'Fetch') {
            return res.json(user);
        }
        
        // 否則回傳完整頁面
        return res.render('subscribe', { user, message: '驗證成功' });
    }

    res.status(403).send('驗證失敗');
});


// 生成驗證碼並寄信的 API
app.post('/send-ps-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).send('Email required');
    const from_mail = process.env.EMAIL_USER;

    // 生成 6 位數驗證碼
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    tempTokens[code] = { email, expires: Date.now() + 600000 };

    try {
            await transporter.sendMail({
                from: `"HosinoNeko" <${from_mail}>`, 
                to: email,
                subject: "您的驗證碼",
                html: `<h3>您的驗證碼為：<b>${code}</b>，10 分鐘內有效。</h3><p>敬上：星野眠子</p>`
            });
            res.json({ success: true });
        } catch (err) {
            console.error('郵件發送失敗報錯：', err); // print ERR
            res.status(500).json({ error: '郵件發送失敗' });
        }
});


// 2. 處理表單提交 (POST)
app.post('/subscribe-post', async (req, res) => {
    const { email, firstname, Lastname, language, 'mod-sub': modSub } = req.body;

    let subs = JSON.parse(await fs.readFile('./sub.json', 'utf8'));
    
    // 尋找是否已存在 (Sign the sub log / Update)
    const index = subs.findIndex(s => s.email === email);
    const newDoc = { firstname, lastname: Lastname, email, language, modSub };

    if (index > -1) {
        subs[index] = newDoc; // 更新
    } else {
        subs.push(newDoc); // 新增
    }

    await fs.writeFile('./sub.json', JSON.stringify(subs, null, 2));
    res.send("SUCCESS");
});



app.get('/subscribe-verify', async (req, res) => {
    const { mail, token } = req.query;

    if (tempTokens[token] && tempTokens[token].email === mail) {
        // 讀取檔案確認是否為既有用戶
        const data = JSON.parse(await fs.readFile('./sub.json', 'utf8'));
        const user = data.find(u => u.email === mail);

        delete tempTokens[token]; // 驗證完立即刪除

        if (user) {
            res.json({ exists: true, ...user });
        } else {
            res.json({ exists: false });
        }
    } else {
        res.status(403).json({ error: 'Invalid token' });
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

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('處理 Webhook 資料時出錯:', error);
        res.status(500).send('Internal Server Error');
    }
});

const port = 3000//process.env.PORT
app.listen(port, () => {
    console.log(`SERVER 運行在 port ${port}`);
});