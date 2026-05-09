const { Client, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

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
const ALLOWED_ROLES = [
    "1498588027008716850",
];

// قاعدة البيانات
const db = new sqlite3.Database('data.db');

db.run(`
CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    messages INTEGER,
    points INTEGER
)
`);

function getUser(userId, callback) {
    db.get("SELECT * FROM users WHERE userId = ?", [userId], (err, row) => {
        if (!row) {
            db.run(
                "INSERT INTO users (userId, messages, points) VALUES (?, 0, 0)",
                [userId]
            );
            callback({ userId, messages: 0, points: 0 });
        } else {
            callback(row);
        }
    });
}

function updateUser(userId, messages, points) {
    db.run(
        "UPDATE users SET messages = ?, points = ? WHERE userId = ?",
        [messages, points, userId]
    );
}

// تحقق من الرول
function hasAllowedRole(member) {
    return member.roles.cache.some(role =>
        ALLOWED_ROLES.includes(role.id)
    );
}

client.on('messageCreate', message => {
    if (message.author.bot) return;

    // لازم يكون عضو بالسيرفر
    const member = message.member;
    if (!member) return;

    // تحقق من الرولات
    if (!hasAllowedRole(member)) return;

    const userId = message.author.id;

    getUser(userId, (user) => {

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
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});
// ضع التوكن هنا
client.login(process.env.TOKEN);

console.log("البوت يعمل");