require('dotenv').config();
const { Bot } = require('node-telegram-bot-api');
const { run } = require('node-telegram-bot-api/node');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Bot(token, { polling: true });

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
    `/antispam - Toggle anti-spam`);
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

// Handle /tictactoe command
bot.hears('/tictactoe', (ctx) => {
  const userId = ctx.from.id;
  if (!db.tictactoeGames[userId]) {
    // Initialize game: 3x3 empty board
    db.tictactoeGames[userId] = { board: Array(9).fill(null), currentPlayer: 'X', status: 'in_progress' };
    saveDB();
    ctx.reply('🎯 *Tic-Tac-Toe*\n\nA new game has started! You are X. Send /tictactoe move <index> to play. (Indices 1-9)');
    return;
  }

  const game = db.tictactoeGames[userId];
  if (game.status !== 'in_progress') {
    return ctx.reply(`❌ Game is ${game.status}. Start a new game with /tictactoe.`);
  }

  ctx.reply(`🎲 *Tic-Tac-Toe*\n\nBoard:\n${game.board.map((cell, i) => `${i + 1}: ${cell || '_'}`).join('\n')}\n\nYour turn (${game.currentPlayer}). Send /tictactoe move <index> (1-9)`);
});

// Handle /news command (Simulated API Integration)
bot.hears(/\/news (.+)/, (ctx) => {
  const topic = ctx.match[1];
  const newsHeadlines = [
    `🤖 Bot update v${BOT_VERSION} rolled out successfully.`,
    `🚀 New mini-game Tic-Tac-Toe is now available!`,
    `💰 Leaderboard updated with daily rewards.`,
    `⚙️ Utility commands like /base64decode and /calc are enhanced.`
  ];
  const headline = newsHeadlines[Math.floor(Math.random() * newsHeadlines.length)];

  ctx.reply(`📰 *News for ${topic}*\n\n${headline}\n\n*Note: This is simulated data.*`);
});

// Handle /tictactoe move command
bot.hears(/\/tictactoe move (\d+)/, (ctx) => {
  const userId = ctx.from.id;
  const index = parseInt(ctx.match[1]);
  const game = db.tictactoeGames[userId];

  if (!game || game.status !== 'in_progress') {
    return ctx.reply('❌ No game in progress! Start with /tictactoe.');
  }

  if (index < 1 || index > 9 || game.board[index - 1] !== null) {
    return ctx.reply('❌ Invalid move or cell already taken. Try again.');
  }

  game.board[index - 1] = game.currentPlayer;
  saveDB();

  // Check for win/draw
  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  let winner = null;
  for (const line of lines) {
    const [a, b, c] = line;
    if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
      winner = game.board[a];
      break;
    }
  }

  if (winner) {
    game.status = 'finished';
    saveDB();
    ctx.reply(`🏆 *Game Over!*\n\nPlayer ${winner} wins! 🎉`);
  } else if (game.board.every(cell => cell !== null)) {
    game.status = 'finished';
    saveDB();
    ctx.reply('🤝 *Game Over!*\n\nIt\'s a draw!');
  } else {
    // Switch player
    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
    saveDB();
    ctx.reply(`🎲 *Tic-Tac-Toe*\n\nBoard:\n${game.board.map((cell, i) => `${i + 1}: ${cell || '_'}`).join('\n')}\n\nNext turn: ${game.currentPlayer}. Send /tictactoe move <index> (1-9)`);
  }
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

// ===== NEW FEATURES =====

// Chess game
const chessGames = new Map();
bot.hears('/chess', (ctx) => {
  const userId = ctx.from.id.toString();
  if (!chessGames.has(userId)) {
    chessGames.set(userId, {
      board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: []
    });
  }
  const game = chessGames.get(userId);
  ctx.reply(`♟️ *Chess Game*\n\nFEN: ${game.board}\nMoves: ${game.moves.join(', ') || 'None'}\n\nSend /chess move <from-to> (e.g., /chess move e2e4)`);
});

// Handle chess move
bot.hears(/\/chess move ([a-h][1-8][a-h][1-8])/, (ctx) => {
  const userId = ctx.from.id.toString();
  const move = ctx.match[1];
  if (!chessGames.has(userId)) {
    return ctx.reply('❌ No chess game! Start with /chess');
  }
  const game = chessGames.get(userId);
  game.moves.push(move);
  ctx.reply(`✅ Move ${move} recorded! Total moves: ${game.moves.length}`);
});

// Minesweeper
bot.hears('/minesweeper', (ctx) => {
  const userId = ctx.from.id.toString();
  const size = 5;
  const mines = 5;
  const board = Array(size).fill().map(() => Array(size).fill('█'));
  const numbers = Array(size).fill().map(() => Array(size).fill(0));

  // Place mines
  for (let i = 0; i < mines; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    numbers[x][y] = -1;
  }

  db.minesweeperGames = db.minesweeperGames || {};
  db.minesweeperGames[userId] = { board, numbers, revealed: Array(size).fill().map(() => Array(size).fill(false)), size };
  saveDB();

  ctx.reply(`💣 *Minesweeper*\n${board.map(row => row.join(' ')).join('\n')}\n\nUse /mine reveal <x> <y>`);
});

// Handle mine reveal
bot.hears(/\/mine reveal (\d) (\d)/, (ctx) => {
  const userId = ctx.from.id.toString();
  const x = parseInt(ctx.match[1]);
  const y = parseInt(ctx.match[2]);

  if (!db.minesweeperGames || !db.minesweeperGames[userId]) {
    return ctx.reply('❌ No game! Start with /minesweeper');
  }

  const game = db.minesweeperGames[userId];
  if (x >= game.size || y >= game.size) {
    return ctx.reply('❌ Out of bounds!');
  }

  if (game.numbers[x][y] === -1) {
    ctx.reply('💥 Boom! You hit a mine!');
    delete db.minesweeperGames[userId];
    saveDB();
  } else {
    game.revealed[x][y] = true;
    saveDB();
    ctx.reply(`✅ Revealed (${x},${y})`);
  }
});

// 2048 game
bot.hears('/2048', (ctx) => {
  const userId = ctx.from.id.toString();
  const board = Array(4).fill().map(() => Array(4).fill(0));
  // Add two random tiles
  for (let i = 0; i < 2; i++) {
    const x = Math.floor(Math.random() * 4);
    const y = Math.floor(Math.random() * 4);
    board[x][y] = Math.random() < 0.9 ? 2 : 4;
  }

  db.game2048 = db.game2048 || {};
  db.game2048[userId] = { board, score: 0 };
  saveDB();

  ctx.reply(`🔢 *2048 Game*\n${board.map(row => row.join('\t')).join('\n')}\nScore: 0\nUse /2048 move <up|down|left|right>`);
});

// Rock Paper Scissors Lizard Spock
bot.hears('/rpsls', (ctx) => {
  const choices = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
  const botChoice = choices[Math.floor(Math.random() * choices.length)];
  const userChoice = ctx.match ? ctx.match[1] : null;

  if (!userChoice) {
    return ctx.reply(`🪨 *Rock Paper Scissors Lizard Spock*\nChoices: rock, paper, scissors, lizard, spock\nUsage: /rpsls <choice>`);
  }

  const userLower = userChoice.toLowerCase();
  if (!choices.includes(userLower)) {
    return ctx.reply('❌ Invalid choice!');
  }

  const rules = {
    rock: ['scissors', 'lizard'],
    paper: ['rock', 'spock'],
    scissors: ['paper', 'lizard'],
    lizard: ['spock', 'paper'],
    spock: ['scissors', 'rock']
  };

  let result;
  if (userLower === botChoice) {
    result = '🤝 Tie!';
  } else if (rules[userLower].includes(botChoice)) {
    result = '✅ You win!';
    addScore(ctx.from.id, 10);
  } else {
    result = '❌ You lose!';
  }

  ctx.reply(`🪨 *RPSLS*\nYou: ${userLower}\nBot: ${botChoice}\n${result}`);
});

// Trivia with categories
bot.hears('/trivia', (ctx) => {
  const trivia = {
    science: [
      { q: 'What planet is known as the Red Planet?', a: ['Mars', 'Venus', 'Jupiter', 'Saturn'] },
      { q: 'What is H2O commonly known as?', a: ['Water', 'Hydrogen', 'Oxygen', 'Helium'] }
    ],
    history: [
      { q: 'In which year did WWII end?', a: ['1945', '1939', '1918', '1969'] },
      { q: 'Who was the first president of USA?', a: ['Washington', 'Lincoln', 'Jefferson', 'Adams'] }
    ],
    sports: [
      { q: 'How many players in a football team?', a: ['11', '9', '7', '15'] },
      { q: 'Which sport uses a shuttlecock?', a: ['Badminton', 'Tennis', 'Squash', 'Table Tennis'] }
    ]
  };

  const categories = Object.keys(trivia);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const question = trivia[category][Math.floor(Math.random() * trivia[category].length)];

  db.triviaGames = db.triviaGames || {};
  db.triviaGames[ctx.from.id] = { answer: question.a[0].toLowerCase(), category };

  ctx.reply(`❓ *Trivia: ${category}*\n${question.q}\nOptions: ${question.a.join(', ')}`);
});

// Answer trivia
bot.hears(/\/answer (.+)/, (ctx) => {
  const userId = ctx.from.id;
  if (!db.triviaGames || !db.triviaGames[userId]) {
    return ctx.reply('❌ No active trivia! Use /trivia');
  }

  const correct = db.triviaGames[userId].answer;
  const userAnswer = ctx.match[1].toLowerCase();

  if (userAnswer === correct) {
    addScore(userId, 20);
    ctx.reply('✅ Correct! +20 points');
  } else {
    ctx.reply(`❌ Wrong! Correct answer: ${correct}`);
  }
  delete db.triviaGames[userId];
  saveDB();
});

// QR Code generator (simulated)
bot.hears('/qr', (ctx) => {
  const text = ctx.match ? ctx.match[1] : '';
  if (!text) {
    return ctx.reply('❌ Usage: /qr <text>');
  }
  const qrCode = `QR:${Buffer.from(text).toString('base64')}`;
  ctx.reply(`🔳 *QR Code Generated*\nText: ${text}\nCode: ${qrCode}\n*Note: Simulated QR code*`);
});

// Currency converter (simulated)
bot.hears(/\/convert (\d+) (\w{3}) to (\w{3})/, (ctx) => {
  const amount = parseFloat(ctx.match[1]);
  const from = ctx.match[2].toUpperCase();
  const to = ctx.match[3].toUpperCase();

  const rates = {
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149, INR: 83,
    AED: 3.67, SAR: 3.75, CAD: 1.36, AUD: 1.52
  };

  if (!rates[from] || !rates[to]) {
    return ctx.reply('❌ Unsupported currency! Use USD/EUR/GBP/JPY/INR/AED/SAR/CAD/AUD');
  }

  const usdAmount = amount / rates[from];
  const converted = usdAmount * rates[to];

  ctx.reply(`💱 *Currency Converter*\n${amount} ${from} = ${converted.toFixed(2)} ${to}`);
});

// URL shortener (simulated)
bot.hears(/\/shorten (.+)/, (ctx) => {
  const url = ctx.match[1];
  const shortCode = Math.random().toString(36).substring(2, 8);
  ctx.reply(`🔗 *Shortened URL*\nOriginal: ${url}\nShort: https://ox.ly/${shortCode}`);
});

// AI Chat (simulated)
bot.hears(/\/ai (.+)/, (ctx) => {
  const prompt = ctx.match[1];
  const responses = [
    `🤖 I understand you're asking about "${prompt}". Would you like more details?`,
    `🧠 As an AI, I think "${prompt}" is an interesting topic!`,
    `💡 Regarding "${prompt}", here's what I know...`
  ];
  ctx.reply(responses[Math.floor(Math.random() * responses.length)]);
});

// Image description (simulated)
bot.hears('/describe', (ctx) => {
  ctx.reply(`🖼️ *Image Description*\nPlease send an image and I'll describe it!\n*Note: Simulated feature*`);
});

// Text summarization
bot.hears(/\/summarize (.+)/, (ctx) => {
  const text = ctx.match[1];
  const words = text.split(' ');
  const summary = words.slice(0, Math.min(20, words.length)).join(' ') + '...';
  ctx.reply(`📝 *Summary*\n${summary}`);
});

// Mood analysis
bot.hears(/\/mood (.+)/, (ctx) => {
  const text = ctx.match[1].toLowerCase();
  const positive = ['happy', 'good', 'great', 'love', 'awesome', 'nice'];
  const negative = ['sad', 'bad', 'angry', 'hate', 'terrible', 'awful'];

  let score = 0;
  positive.forEach(word => { if (text.includes(word)) score++; });
  negative.forEach(word => { if (text.includes(word)) score--; });

  let mood;
  if (score > 0) mood = '😊 Positive';
  else if (score < 0) mood = '😔 Negative';
  else mood = '😐 Neutral';

  ctx.reply(`😊 *Mood Analysis*\nText: ${ctx.match[1]}\nMood: ${mood}\nScore: ${score}`);
});

// ===== NEW FEATURES =====

// Password Generator
bot.hears(/\/password(?: (\d+))?(?: ([\w\-]+))?/, (ctx) => {
  const length = parseInt(ctx.match[1]) || 16;
  const options = ctx.match[2] || 'all';

  if (length < 4 || length > 128) {
    return ctx.reply('Length must be between 4 and 128');
  }

  const charsets = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    ambig: 'il1Lo0O'
  };

  let charset = charsets.lower + charsets.upper + charsets.numbers + charsets.symbols;

  if (options === 'alphanum') {
    charset = charsets.lower + charsets.upper + charsets.numbers;
  } else if (options === 'noambig') {
    charset = charset.split('').filter(c => !charsets.ambig.includes(c)).join('');
  } else if (options === 'pin') {
    charset = charsets.numbers;
  } else if (options === 'words') {
    const words = ['correct', 'horse', 'battery', 'staple', 'apple', 'banana', 'cherry', 'diamond', 'elephant', 'forest', 'guitar', 'hammer', 'island', 'jungle', 'kitchen', 'laptop', 'mountain', 'notebook', 'ocean', 'pencil', 'quantum', 'river', 'sunset', 'tiger', 'umbrella', 'violin', 'window', 'xylophone', 'yacht', 'zebra'];
    const count = Math.min(length, 10);
    const passphrase = Array.from({ length: count }, () => words[Math.floor(Math.random() * words.length)]).join('-');
    return ctx.reply('Passphrase Generated\n\n`' + passphrase + '`\n\nLength: ' + passphrase.length + ' chars\nWords: ' + count);
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  const entropy = Math.log2(Math.pow(charset.length, length));
  const strength = entropy < 30 ? 'Very Weak' : entropy < 60 ? 'Weak' : entropy < 90 ? 'Fair' : entropy < 120 ? 'Strong' : 'Very Strong';

  ctx.reply('Password Generated\n\n`' + password + '`\n\nLength: ' + length + '\nCharset: ' + charset.length + ' chars\nEntropy: ' + entropy.toFixed(1) + ' bits\nStrength: ' + strength + '\n\nOptions: all (default), alphanum, noambig, pin, words');
});

// Color Tools
bot.hears(/\/color (.+)/, (ctx) => {
  const input = ctx.match[1].trim();

  // Hex to RGB
  if (input.startsWith('#')) {
    const hex = input.slice(1);
    if (!/^[0-9a-fA-F]{3,8}$/.test(hex)) {
      return ctx.reply('Invalid hex color!');
    }
    let r, g, b, a = 1;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
    const hsl = rgbToHsl(r, g, b);
    return ctx.reply('Color Info\n\nHex: #' + hex.toUpperCase() + '\nRGB: rgb(' + r + ', ' + g + ', ' + b + ')' + (a !== 1 ? ' / rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')' : '') + '\nHSL: hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)\n\nPreview: ████████');
  }

  // RGB to Hex
  const rgbMatch = input.match(/^rgb\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)?$/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]), g = parseInt(rgbMatch[2]), b = parseInt(rgbMatch[3]);
    if (r > 255 || g > 255 || b > 255) return ctx.reply('RGB values must be 0-255!');
    const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    const hsl = rgbToHsl(r, g, b);
    return ctx.reply('Color Info\n\nRGB: rgb(' + r + ', ' + g + ', ' + b + ')\nHex: #' + hex + '\nHSL: hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)\n\nPreview: ████████');
  }

  // Random color
  if (input.toLowerCase() === 'random') {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    const hsl = rgbToHsl(r, g, b);
    return ctx.reply('Random Color\n\nHex: #' + hex + '\nRGB: rgb(' + r + ', ' + g + ', ' + b + ')\nHSL: hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)\n\nPreview: ████████');
  }

  // Named colors
  const namedColors = {
    red: '#FF0000', green: '#00FF00', blue: '#0000FF',
    white: '#FFFFFF', black: '#000000', yellow: '#FFFF00',
    cyan: '#00FFFF', magenta: '#FF00FF', orange: '#FFA500',
    purple: '#800080', pink: '#FFC0CB', brown: '#A52A2A',
    gray: '#808080', grey: '#808080', lime: '#00FF00',
    navy: '#000080', teal: '#008080', olive: '#808000',
    maroon: '#800000', silver: '#C0C0C0', gold: '#FFD700'
  };

  const lowerInput = input.toLowerCase();
  if (namedColors[lowerInput]) {
    const hex = namedColors[lowerInput].slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const hsl = rgbToHsl(r, g, b);
    return ctx.reply(input.charAt(0).toUpperCase() + input.slice(1) + '\n\nHex: #' + hex.toUpperCase() + '\nRGB: rgb(' + r + ', ' + g + ', ' + b + ')\nHSL: hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)\n\nPreview: ████████');
  }

  ctx.reply('Usage: /color #ff0000 | /color rgb(255,0,0) | /color random | /color red');
});

// RGB to HSL helper
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Base Converter
bot.hears(/\/base (\d+) (\d+) (\w+)/, (ctx) => {
  const fromBase = parseInt(ctx.match[1]);
  const toBase = parseInt(ctx.match[2]);
  const value = ctx.match[3].toUpperCase();

  if (fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
    return ctx.reply('Base must be between 2 and 36');
  }

  try {
    const decimal = parseInt(value, fromBase);
    if (isNaN(decimal)) {
      return ctx.reply('Invalid number for the given base!');
    }
    const result = decimal.toString(toBase).toUpperCase();

    const baseNames = {
      2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal'
    };

    ctx.reply('Base Converter\n\n' + (baseNames[fromBase] || 'Base ' + fromBase) + ': ' + value + '\n' + (baseNames[toBase] || 'Base ' + toBase) + ': ' + result + '\n\nDecimal: ' + decimal);
  } catch (e) {
    ctx.reply('Conversion error!');
  }
});

// Quick base conversions
bot.hears(/\/bin (\d+)/, (ctx) => {
  const num = parseInt(ctx.match[1]);
  ctx.reply('Binary\n\nDecimal: ' + num + '\nBinary: ' + num.toString(2) + '\nOctal: ' + num.toString(8) + '\nHex: ' + num.toString(16).toUpperCase());
});

bot.hears(/\/hex (\w+)/, (ctx) => {
  const num = parseInt(ctx.match[1], 16);
  if (isNaN(num)) return ctx.reply('Invalid hex!');
  ctx.reply('Hexadecimal\n\nHex: ' + ctx.match[1].toUpperCase() + '\nDecimal: ' + num + '\nBinary: ' + num.toString(2) + '\nOctal: ' + num.toString(8));
});

// Notes/Todo System
bot.hears(/\/note add (.+)/, (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.match[1];

  if (!userNotes.has(userId)) userNotes.set(userId, []);
  const notes = userNotes.get(userId);
  notes.push({ text, created: Date.now() });
  db.userNotes[userId] = notes;
  saveDB();

  ctx.reply('Note Added\n\n"' + text + '"\n\nTotal notes: ' + notes.length + '\nUse /note list to view');
});

bot.hears('/note list', (ctx) => {
  const userId = ctx.from.id;
  const notes = userNotes.get(userId) || [];

  if (notes.length === 0) {
    return ctx.reply('Your Notes\n\nEmpty! Add one with /note add <text>');
  }

  const list = notes.slice(-10).map((note, i) =>
    (notes.length - notes.slice(-10).length + i + 1) + '. ' + note.text + ' (' + new Date(note.created).toLocaleDateString() + ')'
  ).join('\n');

  ctx.reply('Your Notes (' + notes.length + ' total)\n\n' + list + '\n\nUse /note delete <index> to remove');
});

bot.hears(/\/note delete (\d+)/, (ctx) => {
  const userId = ctx.from.id;
  const index = parseInt(ctx.match[1]) - 1;
  const notes = userNotes.get(userId) || [];

  if (index < 0 || index >= notes.length) {
    return ctx.reply('Invalid note index!');
  }

  const removed = notes.splice(index, 1)[0];
  db.userNotes[userId] = notes;
  saveDB();

  ctx.reply('Note Deleted\n\n"' + removed.text + '"\n\nRemaining: ' + notes.length);
});

bot.hears('/note', (ctx) => {
  ctx.reply('Notes System\n\n/note add <text> - Add a note\n/note list - List your notes\n/note delete <index> - Delete a note');
});

// Birthday Tracker
bot.hears(/\/birthday add (\d{1,2}) (\d{1,2}) (.+)/, (ctx) => {
  const day = parseInt(ctx.match[1]);
  const month = parseInt(ctx.match[2]);
  const name = ctx.match[3];

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return ctx.reply('Invalid date! Day 1-31, Month 1-12');
  }

  const userId = ctx.from.id;
  if (!birthdays.has(userId)) birthdays.set(userId, []);
  const userBirthdays = birthdays.get(userId);

  userBirthdays.push({ name, day, month, created: Date.now() });
  db.birthdays[userId] = userBirthdays;
  saveDB();

  const today = new Date();
  const bdayThisYear = new Date(today.getFullYear(), month - 1, day);
  if (bdayThisYear < today) bdayThisYear.setFullYear(today.getFullYear() + 1);
  const daysUntil = Math.ceil((bdayThisYear - today) / (1000 * 60 * 60 * 24));

  ctx.reply('Birthday Added\n\n' + name + '\n' + day + '/' + month + '\n' + daysUntil + ' days until next birthday\n\nTotal: ' + userBirthdays.length);
});

bot.hears('/birthday list', (ctx) => {
  const userId = ctx.from.id;
  const userBirthdays = birthdays.get(userId) || [];

  if (userBirthdays.length === 0) {
    return ctx.reply('Birthdays\n\nEmpty! Add with /birthday add <day> <month> <name>');
  }

  const today = new Date();
  const list = userBirthdays.map(b => {
    const bdayThisYear = new Date(today.getFullYear(), b.month - 1, b.day);
    if (bdayThisYear < today) bdayThisYear.setFullYear(today.getFullYear() + 1);
    const daysUntil = Math.ceil((bdayThisYear - today) / (1000 * 60 * 60 * 24));
    return b.name + ' - ' + b.day + '/' + b.month + ' (' + daysUntil + ' days)';
  }).sort((a, b) => {
    const daysA = parseInt(a.match(/\((\d+) days\)/)?.[1] || 999);
    const daysB = parseInt(b.match(/\((\d+) days\)/)?.[1] || 999);
    return daysA - daysB;
  }).join('\n');

  ctx.reply('Your Birthdays (' + userBirthdays.length + ')\n\n' + list);
});

bot.hears(/\/birthday delete (\d+)/, (ctx) => {
  const userId = ctx.from.id;
  const index = parseInt(ctx.match[1]) - 1;
  const userBirthdays = birthdays.get(userId) || [];

  if (index < 0 || index >= userBirthdays.length) {
    return ctx.reply('Invalid index!');
  }

  const removed = userBirthdays.splice(index, 1)[0];
  db.birthdays[userId] = userBirthdays;
  saveDB();

  ctx.reply('Birthday Deleted\n\n' + removed.name + ' (' + removed.day + '/' + removed.month + ')');
});

bot.hears('/birthday', (ctx) => {
  ctx.reply('Birthday Tracker\n\n/birthday add <day> <month> <name> - Add birthday\n/birthday list - List all birthdays\n/birthday delete <index> - Delete birthday');
});

// Admin panel
bot.hears('/admin', (ctx) => {
  const ownerId = process.env.BOT_OWNER_ID;
  if (ownerId && ctx.from.id.toString() !== ownerId) {
    return ctx.reply('❌ Unauthorized: Owner only');
  }

  const totalUsers = userStats.size;
  const totalMessages = Array.from(userStats.values()).reduce((sum, s) => sum + s.messages, 0);
  const totalScore = Array.from(userScores.values()).reduce((sum, s) => sum + s, 0);

  ctx.reply(`👑 *Admin Panel*\nUsers: ${totalUsers}\nMessages: ${totalMessages}\nTotal Points: ${totalScore}\nUptime: ${formatUptime(Date.now() - START_TIME)}`);
});

// Group welcome
bot.hears('/welcome', (ctx) => {
  if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
    return ctx.reply('❌ This command works only in groups!');
  }
  ctx.reply('👋 Welcome message set! New members will be greeted!');
});

// Anti-spam toggle
db.spamSettings = db.spamSettings || {};
bot.hears('/antispam', (ctx) => {
  const chatId = ctx.chat.id.toString();
  db.spamSettings[chatId] = !db.spamSettings[chatId];
  saveDB();
  ctx.reply(`🛡️ *Anti-spam*\n${db.spamSettings[chatId] ? 'Enabled' : 'Disabled'}`);
});

// ===== WHATSAPP NUMBER GENERATOR (Realistic Format) =====
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

bot.hears(/\/wanum(?: ([\w\-]+))?(?: (\d+))?/, (ctx) => {
  const countryKey = (ctx.match[1] || 'india').toLowerCase();
  const count = Math.min(parseInt(ctx.match[2]) || 1, 20);

  const country = whatsappCountries[countryKey];
  if (!country) {
    const available = Object.keys(whatsappCountries).join(', ');
    return ctx.reply('Country not found!\nAvailable: ' + available + '\n\nUsage: /wanum [country] [count]');
  }

  const numbers = [];
  for (let i = 0; i < count; i++) {
    numbers.push(generateRealisticNumber(country));
  }

  const list = numbers.map((n, i) => (i + 1) + '. ' + n + '  \n   wa.me/' + n.replace(/[+\s]/g, '')).join('\n');

  ctx.reply('WhatsApp Numbers - Valid Format (' + country.name + ')\n\n' + list + '\n\nFormat: Realistic mobile prefixes + random digits\nNote: Randomly generated. Not registered numbers.');
});

bot.hears('/wanumlist', (ctx) => {
  const list = Object.entries(whatsappCountries).map(([key, c]) => key + ' - ' + c.name + ' (+' + c.code + ')').join('\n');
  ctx.reply('Available Countries:\n\n' + list + '\n\nUsage: /wanum [country] [count]\nExample: /wanum india 5');
});

// Handle errors
bot.on('error', (error) => {
  console.error(`[${BOT_NAME}] Error:`, error.message);
});

bot.on('polling_error', (error) => {
  console.error(`[${BOT_NAME}] Polling error:`, error.code, error.message);
});

console.log(`[${BOT_NAME}] ${BOT_VERSION} - Bot is running...`);
console.log(`[${BOT_NAME}] 40+ commands available`);
run(bot);
