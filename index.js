require('dotenv').config();
const { Bot } = require('node-telegram-bot-api');
const { run } = require('node-telegram-bot-api/node');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Bot(token, { polling: true });

// Bot information
const BOT_NAME = 'pakyji';
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
  wordChainGames: {}
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

// Handle /start command
bot.hears('/start', (ctx) => {
  const stats = getUserStats(ctx.from.id);
  ctx.reply(`🤖 *Welcome to ${BOT_NAME} Bot!* v${BOT_VERSION}\n\n` +
    `Hi @${ctx.from.username || ctx.from.first_name}! 👋\n\n` +
    `I can help you with various tasks. Use /help to see all commands.\n\n` +
    `Messages sent: ${stats.messages}`);
});

// Handle /help command
bot.hears('/help', (ctx) => {
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
    `/leaderboard - Top players\n\n` +
    `*Utility Commands:*\n` +
    `/weather <city> - Weather info (simulated)\n` +
    `/calc <expression> - Calculator\n` +
    `/urlencode <text> - URL encode\n` +
    `/urldecode <text> - URL decode\n` +
    `/base64encode <text> - Base64 encode\n` +
    `/base64decode <text> - Base64 decode\n` +
    `/poll <question> | <opt1> | <opt2> - Create poll\n` +
    `/remind <mins> <msg> - Set reminder\n` +
    `/streak - Check message streak\n\n` +
    `*Admin Commands:*\n` +
    `/broadcast <msg> - Broadcast to all users (owner only)`);
});

// Handle /about command
bot.hears('/about', (ctx) => {
  ctx.reply(`ℹ️ *About ${BOT_NAME}*\n\n` +
    `📦 Version: ${BOT_VERSION}\n` +
    `👨‍💻 Developer: Pakyji\n` +
    `🤖 Bot Name: ${BOT_NAME}\n` +
    `⚡ Features: 20+ commands\n` +
    `🔄 Status: Online\n\n` +
    `Built with Node.js & node-telegram-bot-api`);
});

// Handle /stats command
bot.hears('/stats', (ctx) => {
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
    `• Total messages: ${totalMessages}`);
});

// Handle /uptime command
bot.hears('/uptime', (ctx) => {
  const uptime = formatUptime(Date.now() - START_TIME);
  ctx.reply(`⏱️ *Bot Uptime*\n\n` +
    `🟢 Status: Online\n` +
    `⏱️ Uptime: ${uptime}\n` +
    `🕒 Started: ${new Date(START_TIME).toLocaleString()}\n` +
    `📅 Current: ${new Date().toLocaleString()}`);
});

// Handle /ping command
bot.hears('/ping', (ctx) => {
  const start = Date.now();
  ctx.reply('🏓 Pong!').then(() => {
    const latency = Date.now() - start;
    ctx.reply(`⚡ Latency: ${latency}ms\n` +
      `🤖 Bot is responsive!`);
  });
});

// Handle /time command
bot.hears('/time', (ctx) => {
  const now = new Date();
  ctx.reply(`🕐 *Current Time*\n\n` +
    `📅 Date: ${now.toLocaleDateString()}\n` +
    `⏰ Time: ${now.toLocaleTimeString()}\n` +
    `🌍 Timezone: UTC${now.getTimezoneOffset() / 60 * -1}`);
});

// Handle /date command
bot.hears('/date', (ctx) => {
  ctx.reply(`📅 *Current Date*\n\n` +
    `📆 ${getCurrentDate()}\n` +
    `🗓️ Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`);
});

// Handle /dice command
bot.hears('/dice', (ctx) => {
  const roll = Math.floor(Math.random() * 6) + 1;
  const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  ctx.reply(`🎲 *Dice Roll*\n\n${emojis[roll - 1]} You rolled: ${roll}!`);
});

// Handle /coin command
bot.hears('/coin', (ctx) => {
  const result = Math.random() < 0.5 ? 'Heads 🪙' : 'Tails 🪙';
  ctx.reply(`🪙 *Coin Flip*\n\nResult: ${result}`);
});

// Handle /joke command
bot.hears('/joke', (ctx) => {
  const jokes = [
    "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
    "Why did the developer go broke? Because they used up all their cache! 💸",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡",
    "Why do Java developers wear glasses? Because they can't C#! 🤓",
    "There are 10 types of people: those who understand binary and those who don't! 01"
  ];
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  ctx.reply(`😄 *Random Joke*\n\n${joke}`);
});

// Handle /meme command
bot.hears('/meme', (ctx) => {
  const memes = [
    "When it works on your machine but not in production 😭",
    "POV: You just found a bug that's been there for 2 years",
    "That feeling when you finally fix a 200-line error",
    "When the code compiles on the first try ✨"
  ];
  const meme = memes[Math.floor(Math.random() * memes.length)];
  ctx.reply(`🎭 *Meme*\n\n${meme}\n\n😂`);
});

// Handle /score command
bot.hears('/score', (ctx) => {
  const score = getScore(ctx.from.id);
  const leaderboard = Array.from(userScores.entries())
    .sort((a, b) => b[1] - a[1]);
  const rank = leaderboard.findIndex(([id]) => id === ctx.from.id) + 1;

  ctx.reply(`🏆 *Your Score*\n\n` +
    `💯 Points: ${score}\n` +
    `📊 Rank: #${rank || 'N/A'}\n` +
    `🎯 Total players: ${userScores.size}\n\n` +
    `Earn points with /daily, /gamble (win)!`);
});

// Handle /daily command
bot.hears('/daily', (ctx) => {
  const userId = ctx.from.id;
  const now = Date.now();
  const lastClaim = userStats.get(userId)?.lastDaily || 0;
  const hoursSince = (now - lastClaim) / (1000 * 60 * 60);

  if (hoursSince < 24 && lastClaim > 0) {
    const remaining = Math.ceil(24 - hoursSince);
    ctx.reply(`⏳ Daily reward already claimed!\nCome back in ${remaining} hours.`);
    return;
  }

  const reward = Math.floor(Math.random() * 50) + 50;
  addScore(userId, reward);

  if (!userStats.has(userId)) {
    userStats.set(userId, { messages: 0, firstSeen: now, lastSeen: now, lastDaily: now });
  } else {
    userStats.get(userId).lastDaily = now;
  }

  ctx.reply(`🎁 *Daily Reward Claimed!*\n\n` +
    `💰 You received ${reward} points!\n` +
    `🏆 Total score: ${getScore(userId)}\n` +
    `✅ Next reward in 24 hours!`);
});

// Handle /gamble command
bot.hears(/\/gamble (\d+)/, (ctx) => {
  const amount = parseInt(ctx.match[1]);
  const userId = ctx.from.id;
  const score = getScore(userId);

  if (amount <= 0) ctx.reply('❌ Amount must be positive!'); return;
  if (amount > score) {
    ctx.reply(`❌ Insufficient points!\nYou have ${score} points but tried to gamble ${amount}.`);
    return;
  }

  const won = Math.random() < 0.45;
  if (won) {
    addScore(userId, amount);
    ctx.reply(`🎉 *You Won!*\n\n💰 Bet: ${amount} points\n🏆 Won: ${amount * 2} points\n📊 Total: ${getScore(userId)} points`);
  } else {
    addScore(userId, -amount);
    ctx.reply(`😢 *You Lost*\n\n💸 Lost: ${amount} points\n📊 Total: ${getScore(userId)} points\n\nBetter luck next time! 🍀`);
  }
});

// Handle /inventory command
bot.hears('/inventory', (ctx) => {
  const inv = userInventory.get(ctx.from.id) || [];
  if (inv.length === 0) {
    ctx.reply(`🎒 *Inventory*\n\nEmpty! Try earning some items.`);
    return;
  }
  const items = inv.slice(-10).map((item, i) =>
    `${i + 1}. ${item.item} (${new Date(item.timestamp).toLocaleDateString()})`
  ).join('\n');
  ctx.reply(`🎒 *Your Inventory* (${inv.length} items)\n\n${items}`);
});

// Handle /leaderboard command
bot.hears('/leaderboard', (ctx) => {
  const leaderboard = Array.from(userScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (leaderboard.length === 0) {
    ctx.reply('🏆 Leaderboard is empty! Play some games to get on the board.');
    return;
  }

  const entries = leaderboard.map(([userId, score], i) =>
    `${i + 1}. User ${userId.slice(-4)} - ${score} pts`
  ).join('\n');

  ctx.reply(`🏆 *Top Players*\n\n${entries}`);
});

// Handle /weather command
bot.hears(/\/weather (.+)/, (ctx) => {
  const city = ctx.match[1];
  const temps = ['22°C', '18°C', '25°C', '15°C', '28°C'];
  const conditions = ['Sunny ☀️', 'Cloudy ☁️', 'Rainy 🌧️', 'Windy 💨', 'Clear 🌙'];
  const temp = temps[Math.floor(Math.random() * temps.length)];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];

  ctx.reply(`🌤️ *Weather in ${city}*\n\n` +
    `🌡️ Temperature: ${temp}\n` +
    `🌈 Condition: ${condition}\n` +
    `💧 Humidity: ${Math.floor(Math.random() * 50) + 50}%\n` +
    `💨 Wind: ${Math.floor(Math.random() * 30) + 5} km/h\n\n` +
    `*Simulated data*`);
});

// Handle /calc command
bot.hears(/\/calc (.+)/, (ctx) => {
  try {
    const expression = ctx.match[1];
    if (!/^[\d\s+\-*/().]+$/.test(expression)) {
      ctx.reply('❌ Invalid expression! Only numbers and + - * / ( ) allowed.');
      return;
    }
    const result = Function(`"use strict"; return (${expression})`)();
    ctx.reply(`🧮 *Calculator*\n\n${expression} = ${result}`);
  } catch (e) {
    ctx.reply('❌ Error calculating expression. Check your syntax.');
  }
});

// Handle /urlencode command
bot.hears(/\/urlencode (.+)/, (ctx) => {
  const text = ctx.match[1];
  const encoded = encodeURIComponent(text);
  ctx.reply(`🔗 *URL Encoded*\n\n\`${encoded}\``);
});

// Handle /urldecode command
bot.hears(/\/urldecode (.+)/, (ctx) => {
  try {
    const text = ctx.match[1];
    const decoded = decodeURIComponent(text);
    ctx.reply(`🔓 *URL Decoded*\n\n${decoded}`);
  } catch (e) {
    ctx.reply('❌ Invalid URL encoding!');
  }
});

// Handle /base64encode command
bot.hears(/\/base64encode (.+)/, (ctx) => {
  const text = ctx.match[1];
  const encoded = Buffer.from(text).toString('base64');
  ctx.reply(`🔐 *Base64 Encoded*\n\n\`${encoded}\``);
});

// Handle /base64decode command
bot.hears(/\/base64decode (.+)/, (ctx) => {
  try {
    const text = ctx.match[1];
    const decoded = Buffer.from(text, 'base64').toString('utf-8');
    ctx.reply(`🔓 *Base64 Decoded*\n\n${decoded}`);
  } catch (e) {
    ctx.reply('❌ Invalid Base64 encoding!');
  }
});

// Handle text commands
bot.hears(/\/reverse (.+)/, (ctx) => {
  const text = ctx.match[1];
  const reversed = text.split('').reverse().join('');
  ctx.reply(`🔄 *Reversed*\n\n${reversed}`);
});

bot.hears(/\/upper (.+)/, (ctx) => {
  const text = ctx.match[1].toUpperCase();
  ctx.reply(`🔠 *Uppercase*\n\n${text}`);
});

bot.hears(/\/lower (.+)/, (ctx) => {
  const text = ctx.match[1].toLowerCase();
  ctx.reply(`🔡 *Lowercase*\n\n${text}`);
});

bot.hears(/\/count (.+)/, (ctx) => {
  const text = ctx.match[1];
  const chars = text.length;
  const words = text.trim().split(/\s+/).filter(w => w).length;
  const lines = text.split('\n').length;
  ctx.reply(`📏 *Text Analysis*\n\n📝 Characters: ${chars}\n🔤 Words: ${words}\n📄 Lines: ${lines}`);
});

bot.hears('/quote', (ctx) => {
  const quotes = [
    "The best way to predict the future is to create it.",
    "Code is like humor. When you have to explain it, it's bad.",
    "Simplicity is the soul of efficiency.",
    "First, solve the problem. Then, write the code."
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  ctx.reply(`💬 *Inspiration*\n\n"${quote}"`);
});

bot.hears(/\/echo (.+)/, (ctx) => {
  ctx.reply(`📢 *Echo*\n\n${ctx.match[1]}`);
});

// Handle /broadcast command
bot.hears(/\/broadcast (.+)/, (ctx) => {
  const ownerId = process.env.BOT_OWNER_ID;
  if (ownerId && ctx.from.id.toString() !== ownerId) {
    return ctx.reply('❌ Unauthorized: Owner only command');
  }
  const message = ctx.match[1];
  let count = 0;
  for (const [userId] of userStats) {
    try {
      bot.sendMessage(userId, `📢 *Broadcast from ${BOT_NAME}*\n\n${message}`);
      count++;
    } catch (e) {}
  }
  ctx.reply(`✅ Broadcast sent to ${count} users`);
});

// NEW FEATURES

// Handle /poll command
bot.hears(/\/poll (.+)/, (ctx) => {
  const input = ctx.match[1];
  const parts = input.split('|').map(p => p.trim());
  if (parts.length < 3) {
    return ctx.reply('❌ Usage: /poll Question | Option1 | Option2 | Option3...');
  }
  const question = parts[0];
  const options = parts.slice(1).slice(0, 10);
  if (options.length < 2) {
    return ctx.reply('❌ Need at least 2 options!');
  }
  bot.createPoll(question, options).then(() => {
    ctx.reply('✅ Poll created successfully!');
  }).catch(e => {
    ctx.reply('❌ Failed to create poll');
  });
});

// Handle /remind command
bot.hears(/\/remind (\d+) (.+)/, (ctx) => {
  const minutes = parseInt(ctx.match[1]);
  const message = ctx.match[2];
  const userId = ctx.from.id;
  const remindTime = Date.now() + (minutes * 60 * 1000);

  const reminder = {
    userId,
    message,
    time: remindTime,
    chatId: ctx.chat.id
  };

  if (!db.reminders) db.reminders = [];
  db.reminders.push(reminder);
  saveDB();

  setTimeout(() => {
    bot.sendMessage(userId, `⏰ *Reminder*\n\n${message}`).catch(() => {});
    db.reminders = db.reminders.filter(r => r !== reminder);
    saveDB();
  }, minutes * 60 * 1000);

  ctx.reply(`✅ Reminder set for ${minutes} minutes from now`);
});

// Handle /hangman command
bot.hears('/hangman', (ctx) => {
  const words = ['javascript', 'telegram', 'bot', 'programming', 'computer', 'developer', 'pakyji'];
  const word = words[Math.floor(Math.random() * words.length)];
  const userId = ctx.from.id;

  db.hangmanGames[userId] = {
    word,
    guessed: [],
    wrong: 0,
    maxWrong: 6
  };
  saveDB();

  const display = word.split('').map(l => db.hangmanGames[userId].guessed.includes(l) ? l : '_').join(' ');
  ctx.reply(`🎯 *Hangman Game*\n\nWord: ${display}\nWrong guesses: ${db.hangmanGames[userId].wrong}/6\n\nGuess a letter! Send /guess <letter>`);
});

// Handle /guess command
bot.hears(/\/guess ([a-zA-Z])/, (ctx) => {
  const userId = ctx.from.id;
  const letter = ctx.match[1].toLowerCase();
  const game = db.hangmanGames[userId];

  if (!game) {
    return ctx.reply('❌ No game in progress! Use /hangman to start.');
  }

  if (game.guessed.includes(letter)) {
    return ctx.reply('❌ Already guessed that letter!');
  }

  game.guessed.push(letter);
  if (!game.word.includes(letter)) {
    game.wrong++;
  }
  saveDB();

  const display = game.word.split('').map(l => game.guessed.includes(l) ? l : '_').join(' ');
  let msg = `🎯 *Hangman*\n\nWord: ${display}\nWrong: ${game.wrong}/6\nGuessed: ${game.guessed.join(', ')}`;

  if (game.wrong >= game.maxWrong) {
    msg += `\n\n❌ Game Over! Word was: ${game.word}`;
    delete db.hangmanGames[userId];
    saveDB();
  } else if (!display.includes('_')) {
    msg += `\n\n✅ You won! Word was: ${game.word}`;
    delete db.hangmanGames[userId];
    saveDB();
  }

  ctx.reply(msg);
});

// Handle /wordchain command
bot.hears(/\/wordchain (.+)/, (ctx) => {
  const userId = ctx.from.id.toString() + ctx.chat.id.toString();
  const word = ctx.match[1].toLowerCase();

  if (!db.wordChainGames[userId]) {
    db.wordChainGames[userId] = {
      lastWord: null,
      lastChar: null,
      count: 0
    };
  }

  const game = db.wordChainGames[userId];

  if (game.lastWord && !word.startsWith(game.lastChar)) {
    return ctx.reply(`❌ Word must start with '${game.lastChar}'! Last word was: ${game.lastWord}`);
  }

  game.lastWord = word;
  game.lastChar = word[word.length - 1];
  game.count++;
  saveDB();

  ctx.reply(`✅ Good! Next word must start with '${game.lastChar}'\nChain length: ${game.count}`);
});

// Handle /quiz command
bot.hears('/quiz', (ctx) => {
  const quizzes = [
    { q: 'What is 2+2?', a: '4', opts: ['3', '4', '5', '6'] },
    { q: 'Which language is used for Telegram bots?', a: 'JavaScript', opts: ['Python', 'JavaScript', 'Java', 'C++'] },
    { q: 'What is the capital of France?', a: 'Paris', opts: ['London', 'Paris', 'Berlin', 'Rome'] }
  ];
  const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
  ctx.reply(`❓ *Quiz*\n\n${quiz.q}\n\nOptions:\n${quiz.opts.map((o, i) => `${i+1}. ${o}`).join('\n')}\n\nReply with the option number!`);
});

// Handle /streak command
bot.hears('/streak', (ctx) => {
  const userId = ctx.from.id;
  const stats = userStats.get(userId);
  if (!stats) {
    return ctx.reply('❌ No stats found! Send some messages first.');
  }

  const lastSeen = new Date(stats.lastSeen);
  const now = new Date();
  const diffDays = Math.floor((now - lastSeen) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    ctx.reply('📉 Streak broken! Keep chatting daily to build streak.');
  } else {
    const streakMsg = `🔥 *Your Streak*\n\nMessages today: ${stats.messages}\nLast seen: ${lastSeen.toLocaleDateString()}\n\nKeep going!`;
    ctx.reply(streakMsg);
  }
});

// Handle messages
bot.on('message', (ctx) => {
  if (!ctx.message.text || ctx.message.text.startsWith('/')) return;

  const stats = getUserStats(ctx.from.id);
  const userName = ctx.from.first_name || 'User';

  if (CONFIG.autoReply && Math.random() < 0.3) {
    const responses = [
      `Got it, ${userName}! 👍`,
      `Interesting! 🤔`,
      `Thanks for the message! 💬`,
      `I see what you mean! 👌`
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    if (stats.messages % 3 === 0) {
      ctx.reply(response);
    }
  }

  if (ctx.message.text.toLowerCase().includes('pakyji') ||
      ctx.message.text.toLowerCase().includes('bot')) {
    ctx.reply(`🤖 Hey! I'm ${BOT_NAME} Bot at your service! Use /help for commands.`);
  }
});

// Handle errors
bot.on('error', (error) => {
  console.error(`[${BOT_NAME}] Error:`, error.message);
});

bot.on('polling_error', (error) => {
  console.error(`[${BOT_NAME}] Polling error:`, error.code, error.message);
});

console.log(`[${BOT_NAME}] ${BOT_VERSION} - Bot is running...`);
console.log(`[${BOT_NAME}] 30+ commands available`);
run(bot);
