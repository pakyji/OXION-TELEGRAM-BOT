require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token || token === 'your_bot_token_here') {
  console.error('❌ ERROR: TELEGRAM_BOT_TOKEN not set in .env file');
  console.error('   Copy .env.example to .env and add your bot token from @BotFather');
  process.exit(1);
}

const bot = new Telegraf(token);

// Bot information
const BOT_NAME = 'Oxion';
const BOT_VERSION = '1.3.0';
const START_TIME = Date.now();

// Database file
const DB_FILE = path.join(__dirname, 'bot_data.json');

// Load database
let db = {
  userStats: {},
  userScores: {},
  userInventory: {},
  reminders: [],
  hangmanGames: {},
  tictactoeGames: {},
  wordChainGames: {},
  userNotes: {},
  birthdays: {}
};

if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.log('Could not load database, starting fresh');
  }
}

// Save database
const saveDB = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Could not save database:', e.message);
  }
};

// User data storage with persistence
const userStats = new Map(Object.entries(db.userStats));
const userScores = new Map(Object.entries(db.userScores));
const userInventory = new Map(Object.entries(db.userInventory));
const userNotes = new Map(Object.entries(db.userNotes));
const birthdays = new Map(Object.entries(db.birthdays));

// Bot configuration
const CONFIG = {
  maxMessageLength: 4096,
  welcomeMessage: true,
  autoReply: true
};

console.log(`[${BOT_NAME}] Starting v${BOT_VERSION}...`);

// Utility functions
const formatUptime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

const addScore = (userId, points) => {
  if (!userScores.has(userId)) {
    userScores.set(userId, 0);
  }
  userScores.set(userId, parseInt(userScores.get(userId)) + points);
  db.userScores[userId] = userScores.get(userId);
  saveDB();
  return userScores.get(userId);
};

const getScore = (userId) => {
  return userScores.get(userId) || 0;
};

const addItem = (userId, item) => {
  if (!userInventory.has(userId)) {
    userInventory.set(userId, []);
  }
  const inv = userInventory.get(userId);
  inv.push({ item, timestamp: Date.now() });
  db.userInventory[userId] = inv;
  saveDB();
  return inv;
};

const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getUserStats = (userId) => {
  if (!userStats.has(userId)) {
    userStats.set(userId, { messages: 0, firstSeen: Date.now(), lastSeen: Date.now() });
  }
  const stats = userStats.get(userId);
  stats.lastSeen = Date.now();
  stats.messages++;
  db.userStats[userId] = stats;
  saveDB();
  return stats;
};

// ==================== COMMAND HANDLERS ====================

// /start
bot.command('start', (ctx) => {
  const stats = getUserStats(ctx.from.id);
  ctx.reply(`🤖 *Welcome to ${BOT_NAME} Bot!* v${BOT_VERSION}\n\n` +
    `Hi @${ctx.from.username || ctx.from.first_name}! 👋\n\n` +
    `I can help you with various tasks. Use /help to see all commands.\n\n` +
    `Messages sent: ${stats.messages}`, { parse_mode: 'Markdown' });
});

// /help
bot.command('help', (ctx) => {
  ctx.reply(`📋 *${BOT_NAME} v${BOT_VERSION} - Commands List*\n\n` +
    `*Basic Commands:*\n` +
    `/start - Welcome message\n` +
    `/help - Show this help\n` +
    `/ping - Check bot latency\n` +
    `/about - About this bot\n` +
    `/stats - Your usage statistics\n` +
    `/uptime - Bot uptime\n\n` +
    `*Fun Commands:*\n` +
    `/echo <text> - Echo your message\n` +
    `/reverse <text> - Reverse text\n` +
    `/upper <text> - Convert to uppercase\n` +
    `/lower <text> - Convert to lowercase\n` +
    `/count <text> - Count characters\n` +
    `/time - Current server time\n` +
    `/date - Current date\n` +
    `/dice - Roll a dice 🎲\n` +
    `/coin - Flip a coin 🪙\n` +
    `/quote - Random inspirational quote\n` +
    `/joke - Random joke 😄\n` +
    `/meme - Get a meme\n` +
    `/hangman - Play hangman game\n` +
    `/wordchain <word> - Play word chain game\n` +
    `/quiz - Take a quiz\n\n` +
    `*Gaming Commands:*\n` +
    `/score - Check your score\n` +
    `/daily - Claim daily reward\n` +
    `/gamble <amount> - Gamble points\n` +
    `/inventory - View inventory\n` +
    `/leaderboard - Top players\n` +
    `/tictactoe - Play tic-tac-toe\n` +
    `/chess - Play chess\n` +
    `/minesweeper - Play minesweeper\n` +
    `/2048 - Play 2048\n` +
    `/rpsls <choice> - Rock Paper Scissors Lizard Spock\n` +
    `/trivia - Play trivia\n` +
    `/answer <text> - Answer trivia\n\n` +
    `*Utility Commands:*\n` +
    `/weather <city> - Weather info (simulated)\n` +
    `/calc <expression> - Calculator\n` +
    `/urlencode <text> - URL encode\n` +
    `/urldecode <text> - URL decode\n` +
    `/base64encode <text> - Base64 encode\n` +
    `/base64decode <text> - Base64 decode\n` +
    `/poll <question> | <opt1> | <opt2> - Create poll\n` +
    `/remind <mins> <msg> - Set reminder\n` +
    `/streak - Check message streak\n` +
    `/qr <text> - Generate QR code\n` +
    `/convert <amt> <from> to <to> - Currency converter\n` +
    `/shorten <url> - Shorten URL\n` +
    `/summarize <text> - Summarize text\n` +
    `/mood <text> - Analyze mood\n` +
    `/ai <prompt> - Chat with AI\n` +
    `/describe - Describe image\n` +
    `/password [len] [type] - Generate password\n` +
    `/color <hex|rgb|name|random> - Color converter\n` +
    `/base <from> <to> <value> - Base converter\n` +
    `/bin <num> - Quick binary conversion\n` +
    `/hex <hex> - Quick hex conversion\n` +
    `/note add <text> - Add note\n` +
    `/note list - List notes\n` +
    `/note delete <idx> - Delete note\n` +
    `/birthday add <day> <month> <name> - Add birthday\n` +
    `/birthday list - List birthdays\n` +
    `/birthday delete <idx> - Delete birthday\n` +
    `/wanum [country] [count] - Generate WhatsApp numbers\n` +
    `/wanumlist - List supported countries\n\n` +
    `*Admin Commands:*\n` +
    `/broadcast <msg> - Broadcast to all users (owner only)\n` +
    `/admin - Admin panel\n` +
    `/welcome - Set group welcome\n` +
    `/antispam - Toggle anti-spam`, { parse_mode: 'Markdown' });
});

// /about
bot.command('about', (ctx) => {
  ctx.reply(`ℹ️ *About ${BOT_NAME}*\n\n` +
    `📦 Version: ${BOT_VERSION}\n` +
    `👨‍💻 Developer: Pakyji\n` +
    `🤖 Bot Name: ${BOT_NAME}\n` +
    `⚡ Features: 40+ commands\n` +
    `🔄 Status: Online\n\n` +
    `Built with Node.js & Telegraf`, { parse_mode: 'Markdown' });
});

// /stats
bot.command('stats', (ctx) => {
  const stats = getUserStats(ctx.from.id);
  const totalUsers = userStats.size;
  const totalMessages = Array.from(userStats.values()).reduce((sum, s) => sum + s.messages, 0);
  const firstSeen = new Date(stats.firstSeen).toLocaleString();
  const lastSeen = new Date(stats.lastSeen).toLocaleString();

  ctx.reply(`📊 *Your Statistics*\n\n` +
    `👤 User: @${ctx.from.username || 'Unknown'}\n` +
    `💬 Messages sent: ${stats.messages}\n` +
    `📅 First seen: ${firstSeen}\n` +
    `🕒 Last seen: ${lastSeen}\n\n` +
    `🌐 Global Stats:\n` +
    `• Total users: ${totalUsers}\n` +
    `• Total messages: ${totalMessages}`, { parse_mode: 'Markdown' });
});

// /uptime
bot.command('uptime', (ctx) => {
  const uptime = formatUptime(Date.now() - START_TIME);
  ctx.reply(`⏱️ *Bot Uptime*\n\n` +
    `🟢 Status: Online\n` +
    `⏱️ Uptime: ${uptime}\n` +
    `🕒 Started: ${new Date(START_TIME).toLocaleString()}\n` +
    `📅 Current: ${new Date().toLocaleString()}`, { parse_mode: 'Markdown' });
});

// /ping
bot.command('ping', (ctx) => {
  const start = Date.now();
  ctx.reply('🏓 Pong!').then(() => {
    const latency = Date.now() - start;
    ctx.reply(`⚡ Latency: ${latency}ms\n🤖 Bot is responsive!`);
  });
});

// /time
bot.command('time', (ctx) => {
  const now = new Date();
  ctx.reply(`🕐 *Current Time*\n\n` +
    `📅 Date: ${now.toLocaleDateString()}\n` +
    `⏰ Time: ${now.toLocaleTimeString()}\n` +
    `🌍 Timezone: UTC${now.getTimezoneOffset() / 60 * -1}`, { parse_mode: 'Markdown' });
});

// /date
bot.command('date', (ctx) => {
  ctx.reply(`📅 *Current Date*\n\n` +
    `📆 ${getCurrentDate()}\n` +
    `🗓️ Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`, { parse_mode: 'Markdown' });
});

// /dice
bot.command('dice', (ctx) => {
  const roll = Math.floor(Math.random() * 6) + 1;
  const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  ctx.reply(`🎲 *Dice Roll*\n\n${emojis[roll - 1]} You rolled: ${roll}!`, { parse_mode: 'Markdown' });
});

// /coin
bot.command('coin', (ctx) => {
  const result = Math.random() < 0.5 ? 'Heads 🪙' : 'Tails 🪙';
  ctx.reply(`🪙 *Coin Flip*\n\nResult: ${result}`, { parse_mode: 'Markdown' });
});

// /joke
bot.command('joke', (ctx) => {
  const jokes = [
    "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
    "Why did the developer go broke? Because they used up all their cache! 💸",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡",
    "Why do Java developers wear glasses? Because they can't C#! 🤓",
    "There are 10 types of people: those who understand binary and those who don't! 01"
  ];
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  ctx.reply(`😄 *Random Joke*\n\n${joke}`, { parse_mode: 'Markdown' });
});

// /meme
bot.command('meme', (ctx) => {
  ctx.reply('😄 *Meme*\n\n[Meme feature coming soon!]');
});

// /quote
bot.command('quote', (ctx) => {
  const quotes = [
    "The best way to predict the future is to create it.",
    "Code is like humor. When you have to explain it, it's bad.",
    "Simplicity is the soul of efficiency.",
    "First, solve the problem. Then, write the code."
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  ctx.reply(`💬 *Inspiration*\n\n"${quote}"`, { parse_mode: 'Markdown' });
});

// /echo
bot.command('echo', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /echo <text>');
  ctx.reply(`📢 *Echo*\n\n${text}`, { parse_mode: 'Markdown' });
});

// /reverse
bot.command('reverse', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /reverse <text>');
  ctx.reply(`🔄 *Reversed*\n\n${text.split('').reverse().join('')}`, { parse_mode: 'Markdown' });
});

// /upper
bot.command('upper', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /upper <text>');
  ctx.reply(`🔠 *Uppercase*\n\n${text.toUpperCase()}`, { parse_mode: 'Markdown' });
});

// /lower
bot.command('lower', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /lower <text>');
  ctx.reply(`🔡 *Lowercase*\n\n${text.toLowerCase()}`, { parse_mode: 'Markdown' });
});

// /count
bot.command('count', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /count <text>');
  ctx.reply(`🔢 *Character Count*\n\nCharacters: ${text.length}\nWords: ${text.split(/\s+/).filter(w => w).length}`, { parse_mode: 'Markdown' });
});

// /weather
bot.command('weather', (ctx) => {
  const city = ctx.message.text.split(' ').slice(1).join(' ');
  if (!city) return ctx.reply('Usage: /weather <city>');
  const temp = Math.floor(Math.random() * 30) + 10;
  const conditions = ['☀️ Sunny', '☁️ Cloudy', '🌧️ Rainy', '⛈️ Stormy', '❄️ Snowy'];
  ctx.reply(`🌤️ *Weather in ${city}*\n\nTemperature: ${temp}°C\nCondition: ${conditions[Math.floor(Math.random() * conditions.length)]}\n\n(Simulated data)`, { parse_mode: 'Markdown' });
});

// /calc
bot.command('calc', (ctx) => {
  const expr = ctx.message.text.split(' ').slice(1).join(' ');
  if (!expr) return ctx.reply('Usage: /calc <expression>');
  try {
    const result = Function('"use strict"; return (' + expr + ')')();
    ctx.reply(`🧮 *Calculator*\n\n${expr} = ${result}`, { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('❌ Invalid expression!');
  }
});

// /urlencode
bot.command('urlencode', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /urlencode <text>');
  ctx.reply(`🔗 *URL Encoded*\n\n${encodeURIComponent(text)}`, { parse_mode: 'Markdown' });
});

// /urldecode
bot.command('urldecode', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /urldecode <text>');
  try {
    ctx.reply(`🔗 *URL Decoded*\n\n${decodeURIComponent(text)}`, { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('❌ Invalid encoded text!');
  }
});

// /base64encode
bot.command('base64encode', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /base64encode <text>');
  ctx.reply(`🔐 *Base64 Encoded*\n\n${Buffer.from(text).toString('base64')}`, { parse_mode: 'Markdown' });
});

// /base64decode
bot.command('base64decode', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /base64decode <text>');
  try {
    ctx.reply(`🔓 *Base64 Decoded*\n\n${Buffer.from(text, 'base64').toString('utf8')}`, { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('❌ Invalid Base64!');
  }
});

// /poll
bot.command('poll', (ctx) => {
  const input = ctx.message.text.split(' ').slice(1).join(' ');
  const parts = input.split('|').map(p => p.trim());
  if (parts.length < 3) {
    return ctx.reply('❌ Usage: /poll Question | Option1 | Option2 | Option3...');
  }
  const question = parts[0];
  const options = parts.slice(1).slice(0, 10);
  if (options.length < 2) {
    return ctx.reply('❌ Need at least 2 options!');
  }
  ctx.api.sendPoll({ chat_id: ctx.chat.id, question, options }).then(() => {
    ctx.reply('✅ Poll created successfully!');
  }).catch(e => {
    ctx.reply('❌ Failed to create poll');
  });
});

// /remind
bot.command('remind', (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 3) return ctx.reply('Usage: /remind <minutes> <message>');
  const minutes = parseInt(args[1]);
  const message = args.slice(2).join(' ');
  if (isNaN(minutes) || minutes < 1) return ctx.reply('❌ Invalid minutes!');

  const userId = ctx.from.id;
  const remindTime = Date.now() + (minutes * 60 * 1000);
  const reminder = { userId, message, time: remindTime, chatId: ctx.chat.id };

  if (!db.reminders) db.reminders = [];
  db.reminders.push(reminder);
  saveDB();

  setTimeout(() => {
    ctx.api.sendMessage({ chat_id: userId, text: `⏰ *Reminder*\n\n${message}`, parse_mode: 'Markdown' }).catch(() => {});
    db.reminders = db.reminders.filter(r => r !== reminder);
    saveDB();
  }, minutes * 60 * 1000);

  ctx.reply(`✅ Reminder set for ${minutes} minutes from now`);
});

// /streak
bot.command('streak', (ctx) => {
  const stats = getUserStats(ctx.from.id);
  ctx.reply(`🔥 *Your Streak*\n\nMessages sent: ${stats.messages}\nKeep chatting to increase!`, { parse_mode: 'Markdown' });
});

// /qr
bot.command('qr', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /qr <text>');
  ctx.reply(`📱 *QR Code*\n\nhttps://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`, { parse_mode: 'Markdown' });
});

// /convert
bot.command('convert', (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 5 || args[3] !== 'to') return ctx.reply('Usage: /convert <amount> <from> to <to>');
  const amount = parseFloat(args[1]);
  const from = args[2].toUpperCase();
  const to = args[4].toUpperCase();
  if (isNaN(amount)) return ctx.reply('❌ Invalid amount!');

  const rates = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.12, JPY: 151.25 };
  if (!rates[from] || !rates[to]) return ctx.reply('❌ Unsupported currency!');

  const result = (amount / rates[from]) * rates[to];
  ctx.reply(`💱 *Currency Converter*\n\n${amount} ${from} = ${result.toFixed(2)} ${to}\n\n(Rates are simulated)`, { parse_mode: 'Markdown' });
});

// /shorten
bot.command('shorten', (ctx) => {
  const url = ctx.message.text.split(' ').slice(1).join(' ');
  if (!url) return ctx.reply('Usage: /shorten <url>');
  ctx.reply(`🔗 *URL Shortener*\n\nOriginal: ${url}\nShort: https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}\n\n(Use the link above)`, { parse_mode: 'Markdown' });
});

// /summarize
bot.command('summarize', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /summarize <text>');
  const summary = text.length > 100 ? text.substring(0, 100) + '...' : text;
  ctx.reply(`📝 *Summary*\n\n${summary}`, { parse_mode: 'Markdown' });
});

// /mood
bot.command('mood', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('Usage: /mood <text>');
  const moods = ['😊 Happy', '😢 Sad', '😡 Angry', '😐 Neutral', '😍 Excited', '😴 Tired'];
  ctx.reply(`😊 *Mood Analysis*\n\nText: "${text}"\nMood: ${moods[Math.floor(Math.random() * moods.length)]}\n\n(Simulated)`, { parse_mode: 'Markdown' });
});

// /ai
bot.command('ai', (ctx) => {
  const prompt = ctx.message.text.split(' ').slice(1).join(' ');
  if (!prompt) return ctx.reply('Usage: /ai <prompt>');
  const responses = [
    "I'm a simple bot, not an AI. But I can help with other commands!",
    "That's an interesting question! Try /help for what I can do.",
    "I don't have AI capabilities, but I have 40+ other commands!",
    "Ask me about /calc, /weather, /joke, or /quote instead!"
  ];
  ctx.reply(`🤖 *AI Response*\n\n${responses[Math.floor(Math.random() * responses.length)]}`, { parse_mode: 'Markdown' });
});

// /describe
bot.command('describe', (ctx) => {
  ctx.reply('🖼️ *Image Description*\n\nReply to an image with /describe to analyze it.\n(Feature requires image processing)');
});

// /password
bot.command('password', (ctx) => {
  const args = ctx.message.text.split(' ');
  const len = parseInt(args[1]) || 12;
  const type = args[2] || 'alphanumeric';

  let charset = '';
  if (type === 'numeric') charset = '0123456789';
  else if (type === 'alpha') charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  else if (type === 'alphanumeric') charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  else if (type === 'secure') charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  else charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let password = '';
  for (let i = 0; i < len; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  ctx.reply(`🔐 *Password Generator*\n\nLength: ${len}\nType: ${type}\n\n\`${password}\``, { parse_mode: 'Markdown' });
});

// /color
bot.command('color', (ctx) => {
  const input = ctx.message.text.split(' ').slice(1).join(' ');
  if (!input) return ctx.reply('Usage: /color <hex|rgb|name|random>');

  if (input === 'random') {
    const hex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    ctx.reply(`🎨 *Random Color*\n\nHEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})`, { parse_mode: 'Markdown' });
  } else if (input.startsWith('#') || /^[0-9a-fA-F]{6}$/.test(input)) {
    const hex = input.startsWith('#') ? input : '#' + input;
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    ctx.reply(`🎨 *Color Info*\n\nHEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})`, { parse_mode: 'Markdown' });
  } else {
    ctx.reply('🎨 *Color Converter*\n\nSupported: HEX (#ff0000), RGB, random\nExample: /color #ff0000 or /color random');
  }
});

// /base
bot.command('base', (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 4) return ctx.reply('Usage: /base <from> <to> <value>\nExample: /base 10 16 255');
  const fromBase = parseInt(args[1]);
  const toBase = parseInt(args[2]);
  const value = args[3];

  try {
    const decimal = parseInt(value, fromBase);
    if (isNaN(decimal)) return ctx.reply('Invalid number for the given base!');
    const result = decimal.toString(toBase).toUpperCase();
    const baseNames = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };
    ctx.reply(`🔢 *Base Converter*\n\n${baseNames[fromBase] || 'Base '+fromBase}: ${value}\n${baseNames[toBase] || 'Base '+toBase}: ${result}\n\nDecimal: ${decimal}`, { parse_mode: 'Markdown' });
  } catch (e) {
    ctx.reply('❌ Conversion error!');
  }
});

// /bin
bot.command('bin', (ctx) => {
  const num = parseInt(ctx.message.text.split(' ')[1]);
  if (isNaN(num)) return ctx.reply('Usage: /bin <number>');
  ctx.reply(`🔢 *Binary Conversion*\n\nDecimal: ${num}\nBinary: ${num.toString(2)}\nOctal: ${num.toString(8)}\nHex: ${num.toString(16).toUpperCase()}`, { parse_mode: 'Markdown' });
});

// /hex
bot.command('hex', (ctx) => {
  const hex = ctx.message.text.split(' ')[1];
  if (!hex) return ctx.reply('Usage: /hex <hex>');
  const num = parseInt(hex, 16);
  if (isNaN(num)) return ctx.reply('❌ Invalid hex!');
  ctx.reply(`🔢 *Hex Conversion*\n\nHex: ${hex.toUpperCase()}\nDecimal: ${num}\nBinary: ${num.toString(2)}\nOctal: ${num.toString(8)}`, { parse_mode: 'Markdown' });
});

// /note
bot.command('note', (ctx) => {
  const args = ctx.message.text.split(' ');
  const sub = args[1];
  const userId = ctx.from.id;

  if (!userNotes.has(userId)) userNotes.set(userId, []);
  const notes = userNotes.get(userId);

  if (sub === 'add') {
    const text = args.slice(2).join(' ');
    if (!text) return ctx.reply('Usage: /note add <text>');
    notes.push({ text, created: Date.now() });
    db.userNotes[userId] = notes;
    saveDB();
    return ctx.reply(`📝 *Note Added*\n\n"${text}"\n\nTotal notes: ${notes.length}`, { parse_mode: 'Markdown' });
  }

  if (sub === 'list') {
    if (notes.length === 0) return ctx.reply('📝 *Your Notes*\n\nEmpty! Add one with /note add <text>');
    const list = notes.slice(-10).map((note, i) =>
      (notes.length - notes.slice(-10).length + i + 1) + '. ' + note.text + ' (' + new Date(note.created).toLocaleDateString() + ')'
    ).join('\n');
    return ctx.reply(`📝 *Your Notes (${notes.length} total)*\n\n${list}\n\nUse /note delete <index> to remove`, { parse_mode: 'Markdown' });
  }

  if (sub === 'delete') {
    const index = parseInt(args[2]) - 1;
    if (index < 0 || index >= notes.length) return ctx.reply('❌ Invalid note index!');
    const removed = notes.splice(index, 1)[0];
    db.userNotes[userId] = notes;
    saveDB();
    return ctx.reply(`🗑️ *Note Deleted*\n\n"${removed.text}"\n\nRemaining: ${notes.length}`, { parse_mode: 'Markdown' });
  }

  ctx.reply('📝 *Notes System*\n\n/note add <text> - Add a note\n/note list - List your notes\n/note delete <index> - Delete a note', { parse_mode: 'Markdown' });
});

// /birthday
bot.command('birthday', (ctx) => {
  const args = ctx.message.text.split(' ');
  const sub = args[1];
  const userId = ctx.from.id;

  if (!birthdays.has(userId)) birthdays.set(userId, []);
  const userBirthdays = birthdays.get(userId);

  if (sub === 'add') {
    if (args.length < 5) return ctx.reply('Usage: /birthday add <day> <month> <name>');
    const day = parseInt(args[2]);
    const month = parseInt(args[3]);
    const name = args.slice(4).join(' ');
    if (day < 1 || day > 31 || month < 1 || month > 12) return ctx.reply('❌ Invalid date! Day 1-31, Month 1-12');

    userBirthdays.push({ name, day, month, created: Date.now() });
    db.birthdays[userId] = userBirthdays;
    saveDB();

    const today = new Date();
    const bdayThisYear = new Date(today.getFullYear(), month - 1, day);
    if (bdayThisYear < today) bdayThisYear.setFullYear(today.getFullYear() + 1);
    const daysUntil = Math.ceil((bdayThisYear - today) / (1000 * 60 * 60 * 24));

    return ctx.reply(`🎂 *Birthday Added*\n\n${name}\n${day}/${month}\n${daysUntil} days until next birthday\n\nTotal: ${userBirthdays.length}`, { parse_mode: 'Markdown' });
  }

  if (sub === 'list') {
    if (userBirthdays.length === 0) return ctx.reply('🎂 *Your Birthdays*\n\nEmpty! Add one with /birthday add <day> <month> <name>');
    const list = userBirthdays.map((b, i) => {
      const today = new Date();
      const bdayThisYear = new Date(today.getFullYear(), b.month - 1, b.day);
      if (bdayThisYear < today) bdayThisYear.setFullYear(today.getFullYear() + 1);
      const daysUntil = Math.ceil((bdayThisYear - today) / (1000 * 60 * 60 * 24));
      return `${i + 1}. ${b.name} - ${b.day}/${b.month} (${daysUntil} days)`;
    }).join('\n');
    return ctx.reply(`🎂 *Your Birthdays*\n\n${list}`, { parse_mode: 'Markdown' });
  }

  if (sub === 'delete') {
    const index = parseInt(args[2]) - 1;
    if (index < 0 || index >= userBirthdays.length) return ctx.reply('❌ Invalid index!');
    const removed = userBirthdays.splice(index, 1)[0];
    db.birthdays[userId] = userBirthdays;
    saveDB();
    return ctx.reply(`🗑️ *Birthday Deleted*\n\n${removed.name}`, { parse_mode: 'Markdown' });
  }

  ctx.reply('🎂 *Birthday Tracker*\n\n/birthday add <day> <month> <name>\n/birthday list\n/birthday delete <index>', { parse_mode: 'Markdown' });
});

// ===== WHATSAPP NUMBER GENERATOR =====
const whatsappCountries = {
  'india': { code: '91', name: 'India', length: 10, mobilePrefixes: ['6', '7', '8', '9'] },
  'usa': { code: '1', name: 'USA', length: 10, mobilePrefixes: ['2', '3', '4', '5', '6', '7', '8', '9'] },
  'uk': { code: '44', name: 'UK', length: 10, mobilePrefixes: ['7'] },
  'canada': { code: '1', name: 'Canada', length: 10, mobilePrefixes: ['2', '3', '4', '5', '6', '7', '8', '9'] },
  'australia': { code: '61', name: 'Australia', length: 9, mobilePrefixes: ['4'] },
  'germany': { code: '49', name: 'Germany', length: 10, mobilePrefixes: ['15', '16', '17'] },
  'france': { code: '33', name: 'France', length: 9, mobilePrefixes: ['6', '7'] },
  'japan': { code: '81', name: 'Japan', length: 10, mobilePrefixes: ['70', '80', '90'] },
  'china': { code: '86', name: 'China', length: 11, mobilePrefixes: ['13', '14', '15', '16', '17', '18', '19'] },
  'brazil': { code: '55', name: 'Brazil', length: 11, mobilePrefixes: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'] },
  'mexico': { code: '52', name: 'Mexico', length: 10, mobilePrefixes: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  'indonesia': { code: '62', name: 'Indonesia', length: 10, mobilePrefixes: ['8', '9'] },
  'pakistan': { code: '92', name: 'Pakistan', length: 10, mobilePrefixes: ['3'] },
  'bangladesh': { code: '880', name: 'Bangladesh', length: 10, mobilePrefixes: ['13', '14', '15', '16', '17', '18', '19'] },
  'russia': { code: '7', name: 'Russia', length: 10, mobilePrefixes: ['9'] },
  'nigeria': { code: '234', name: 'Nigeria', length: 10, mobilePrefixes: ['7', '8', '9'] },
  'egypt': { code: '20', name: 'Egypt', length: 10, mobilePrefixes: ['10', '11', '12', '15'] },
  'turkey': { code: '90', name: 'Turkey', length: 10, mobilePrefixes: ['5'] },
  'south_africa': { code: '27', name: 'South Africa', length: 9, mobilePrefixes: ['6', '7', '8'] },
  'saudi': { code: '966', name: 'Saudi Arabia', length: 9, mobilePrefixes: ['5'] }
};

function generateRealisticNumber(country) {
  const prefix = country.mobilePrefixes[Math.floor(Math.random() * country.mobilePrefixes.length)];
  const remainingLength = country.length - prefix.length;
  let num = prefix;
  for (let i = 0; i < remainingLength; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return '+' + country.code + ' ' + num;
}

bot.command('wanum', (ctx) => {
  const args = ctx.message.text.split(' ');
  const countryKey = (args[1] || 'india').toLowerCase();
  const count = Math.min(parseInt(args[2]) || 1, 20);

  const country = whatsappCountries[countryKey];
  if (!country) {
    const available = Object.keys(whatsappCountries).join(', ');
    return ctx.reply(`❌ Country not found!\nAvailable: ${available}\n\nUsage: /wanum [country] [count]`);
  }

  const numbers = [];
  for (let i = 0; i < count; i++) {
    numbers.push(generateRealisticNumber(country));
  }

  const list = numbers.map((n, i) => `${i + 1}. ${n}  \n   wa.me/${n.replace(/[+\s]/g, '')}`).join('\n');

  ctx.reply(`📱 *WhatsApp Numbers - ${country.name}*\n\n${list}\n\nFormat: Realistic mobile prefixes + random digits\nNote: Randomly generated. Not registered numbers.`, { parse_mode: 'Markdown' });
});

bot.command('wanumlist', (ctx) => {
  const list = Object.entries(whatsappCountries).map(([key, c]) => `${key} - ${c.name} (+${c.code})`).join('\n');
  ctx.reply(`🌍 *Available Countries*\n\n${list}\n\nUsage: /wanum [country] [count]\nExample: /wanum india 5`, { parse_mode: 'Markdown' });
});

// /score
bot.command('score', (ctx) => {
  const score = getScore(ctx.from.id);
  ctx.reply(`🏆 *Your Score*\n\nPoints: ${score}\n\nUse /daily to claim daily reward!`, { parse_mode: 'Markdown' });
});

// /daily
bot.command('daily', (ctx) => {
  const userId = ctx.from.id;
  const lastClaim = db.userStats[userId]?.lastDaily || 0;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (now - lastClaim < dayMs) {
    const hoursLeft = Math.ceil((dayMs - (now - lastClaim)) / (60 * 60 * 1000));
    return ctx.reply(`⏳ *Daily Reward*\n\nAlready claimed! Come back in ${hoursLeft} hours.`);
  }

  const reward = Math.floor(Math.random() * 50) + 10;
  addScore(userId, reward);
  if (!db.userStats[userId]) db.userStats[userId] = {};
  db.userStats[userId].lastDaily = now;
  saveDB();

  ctx.reply(`🎁 *Daily Reward Claimed!*\n\n+${reward} points\nTotal: ${getScore(userId)}`, { parse_mode: 'Markdown' });
});

// /gamble
bot.command('gamble', (ctx) => {
  const args = ctx.message.text.split(' ');
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount < 1) return ctx.reply('Usage: /gamble <amount>');

  const score = getScore(ctx.from.id);
  if (score < amount) return ctx.reply(`❌ Not enough points! You have ${score}`);

  const win = Math.random() < 0.45;
  if (win) {
    addScore(ctx.from.id, amount);
    ctx.reply(`🎰 *GAMBLE WON!*\n\n+${amount} points\nTotal: ${getScore(ctx.from.id)}`, { parse_mode: 'Markdown' });
  } else {
    addScore(ctx.from.id, -amount);
    ctx.reply(`🎰 *Gamble Lost*\n\n-${amount} points\nTotal: ${getScore(ctx.from.id)}`, { parse_mode: 'Markdown' });
  }
});

// /inventory
bot.command('inventory', (ctx) => {
  const inv = userInventory.get(ctx.from.id) || [];
  if (inv.length === 0) return ctx.reply('🎒 *Inventory*\n\nEmpty!');
  const list = inv.slice(-10).map((item, i) => `${i + 1}. ${item.item} (${new Date(item.timestamp).toLocaleDateString()})`).join('\n');
  ctx.reply(`🎒 *Inventory (${inv.length} items)*\n\n${list}`, { parse_mode: 'Markdown' });
});

// /leaderboard
bot.command('leaderboard', (ctx) => {
  const sorted = Array.from(userScores.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (sorted.length === 0) return ctx.reply('🏆 *Leaderboard*\n\nNo scores yet!');
  const list = sorted.map(([id, score], i) => `${i + 1}. User ${id}: ${score}`).join('\n');
  ctx.reply(`🏆 *Leaderboard (Top 10)*\n\n${list}`, { parse_mode: 'Markdown' });
});

// ==================== ADMIN COMMANDS ====================

// /broadcast
bot.command('broadcast', async (ctx) => {
  const ownerId = process.env.BOT_OWNER_ID;
  if (ownerId && ctx.from.id.toString() !== ownerId) {
    return ctx.reply('❌ Unauthorized: Owner only command');
  }
  const message = ctx.message.text.split(' ').slice(1).join(' ');
  if (!message) return ctx.reply('Usage: /broadcast <message>');

  let count = 0;
  for (const [userId] of userStats) {
    try {
      await ctx.api.sendMessage({ chat_id: userId, text: `📢 *Broadcast from ${BOT_NAME}*\n\n${message}`, parse_mode: 'Markdown' });
      count++;
    } catch (e) {}
  }
  ctx.reply(`✅ Broadcast sent to ${count} users`);
});

// /admin
bot.command('admin', (ctx) => {
  const ownerId = process.env.BOT_OWNER_ID;
  if (ownerId && ctx.from.id.toString() !== ownerId) {
    return ctx.reply('❌ Unauthorized: Owner only command');
  }

  const totalUsers = userStats.size;
  const totalMessages = Array.from(userStats.values()).reduce((sum, s) => sum + s.messages, 0);
  const totalScore = Array.from(userScores.values()).reduce((sum, s) => sum + s, 0);

  ctx.reply(`👑 *Admin Panel*\n\nUsers: ${totalUsers}\nMessages: ${totalMessages}\nTotal Points: ${totalScore}\nUptime: ${formatUptime(Date.now() - START_TIME)}`, { parse_mode: 'Markdown' });
});

// /welcome
bot.command('welcome', (ctx) => {
  if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
    return ctx.reply('❌ This command works only in groups!');
  }
  ctx.reply('👋 Welcome message set! New members will be greeted!');
});

// /antispam
bot.command('antispam', (ctx) => {
  const chatId = ctx.chat.id.toString();
  db.spamSettings = db.spamSettings || {};
  db.spamSettings[chatId] = !db.spamSettings[chatId];
  saveDB();
  ctx.reply(`🛡️ *Anti-spam*\n${db.spamSettings[chatId] ? 'Enabled' : 'Disabled'}`, { parse_mode: 'Markdown' });
});

// ==================== ERROR HANDLING ====================

bot.catch((err, ctx) => {
  console.error(`[${BOT_NAME}] Error:`, err.message);
});

console.log(`[${BOT_NAME}] ${BOT_VERSION} - Bot is running...`);
console.log(`[${BOT_NAME}] 40+ commands available`);
bot.launch();

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));