const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');

// قاعدة البيانات
const db = new Database('data.db');

// إنشاء البوت
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// شات الإرسال
const BOT_CHANNEL_ID = "1502639025058611272";

// الرولات المسموح لها فقط
const ALLOWED_ROLES = ["1498588027008716850"];

// إنشاء الجدول
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    messages INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0
)
`).run();

// جلب المستخدم
function getUser(userId) {
    let user = db.prepare("SELECT * FROM users WHERE userId = ?").get(userId);

    if (!user) {
        db.prepare(
            "INSERT INTO users (userId, messages, points) VALUES (?, 0, 0)"
        ).run(userId);

        user = { userId, messages: 0, points: 0 };
    }

    return user;
}

// تحديث المستخدم
function updateUser(userId, messages, points) {
    db.prepare(
        "UPDATE users SET messages = ?, points = ? WHERE userId = ?"
    ).run(messages, points, userId);
}

// التحقق من الرول
function hasAllowedRole(member) {
    return member.roles.cache.some(role =>
        ALLOWED_ROLES.includes(role.id)
    );
}

// تسجيل الرسائل
client.on('messageCreate', message => {
    if (message.author.bot) return;

    const member = message.member;
    if (!member) return;

    // شرط الرول
    if (!hasAllowedRole(member)) return;

    const userId = message.author.id;

    let user = getUser(userId);

    user.messages++;

    if (user.messages >= 10) {
        user.points++;
        user.messages = 0;

        updateUser(userId, user.messages, user.points);

        const channel = client.channels.cache.get(BOT_CHANNEL_ID);

        if (channel) {
            channel.send(
                `🎉 ${message.author} حصل على نقطة!\n🏆 مجموع نقاطه: ${user.points}`
            );
        }

    } else {
        updateUser(userId, user.messages, user.points);
    }
});

// تشغيل البوت
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// التوكن
client.login(process.env.TOKEN);

console.log("البوت يعمل");