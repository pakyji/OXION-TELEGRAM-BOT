# 🤖 Oxion Telegram Bot

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://telegram.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)
[![Version](https://img.shields.io/badge/Version-2.0.0-brightgreen?style=for-the-badge)](https://github.com/pakyji/OXION-TELEGRAM-BOT)

A feature-rich multi-purpose Telegram bot built with Node.js and node-telegram-bot-api. Complete with gaming features, utilities, 40+ commands, polls, reminders, and games!

## ✨ Features

### 🎮 Gaming Features
- **Daily Rewards** - Claim daily points
- **Gambling System** - Bet your points with 45% win rate
- **Leaderboard** - Compete with other users
- **Score Tracking** - Track your progress
- **Inventory System** - Collect items
- **Hangman Game** - Play classic hangman
- **Word Chain** - Play word chain game
- **Quiz** - Test your knowledge
- **Tic-Tac-Toe** - Play 3x3 grid game
- **Chess Game** - Simple turn-based chess
- **Minesweeper** - Classic mine finding game
- **2048 Game** - Number puzzle game
- **Rock Paper Scissors Lizard Spock** - Extended RPS
- **Trivia Categories** - Science, History, Sports

### 🛠️ Utility Commands
- **Calculator** - Evaluate mathematical expressions
- **Text Tools** - Reverse, uppercase, lowercase, count
- **Encoding** - URL encode/decode, Base64 encode/decode
- **Weather** - Simulated weather information
- **Time & Date** - Current time and date
- **Uptime Monitoring** - Bot status tracking
- **Poll Creation** - Create interactive polls
- **Reminders** - Set timed reminders
- **Message Streak** - Track daily activity
- **QR Code Generator** - Generate QR codes from text
- **Currency Converter** - Convert between currencies
- **URL Shortener** - Shorten long URLs
- **Text Summarization** - Summarize long messages
- **Mood Analysis** - Analyze message sentiment

### 🎲 Fun Commands
- **Dice Roll** - 🎲 Roll a dice
- **Coin Flip** - 🪙 Flip a coin
- **Random Quotes** - 💬 Inspirational quotes
- **Jokes** - 😄 Programmer jokes
- **Memes** - 🎭 Funny memes
- **Echo** - 📢 Echo messages back
- **AI Chat** - Chat with simulated AI
- **Image Description** - Describe uploaded images

### 📊 Statistics
- **User Stats** - Track messages sent
- **Global Stats** - Total users and messages
- **First/Last Seen** - User activity tracking
- **Response Time** - Bot latency monitoring

### 👥 Social Features
- **Group Welcome Messages** - Customizable greetings
- **Anti-Spam Protection** - Rate limiting per chat
- **Admin Panel** - Bot management commands
- **User Roles** - Assign custom roles

## 🚀 Installation

### Prerequisites

- Node.js v14.0.0 or higher
- npm or yarn
- Telegram Bot Token (from @BotFather)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/pakyji/OXION-TELEGRAM-BOT.git
cd OXION-TELEGRAM-BOT
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` and add your Telegram bot token:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
BOT_OWNER_ID=your_telegram_user_id
```

4. **Start the bot**
```bash
npm start
```

Or for development:
```bash
npm run dev
```

## 📚 Commands

### Basic Commands
| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | Show all commands |
| `/about` | Bot information |
| `/ping` | Check bot latency |
| `/stats` | Your usage statistics |
| `/uptime` | Bot uptime |

### Fun Commands
| Command | Description |
|---------|-------------|
| `/echo <text>` | Echo your message |
| `/reverse <text>` | Reverse text |
| `/upper <text>` | Convert to uppercase |
| `/lower <text>` | Convert to lowercase |
| `/count <text>` | Count characters/words |
| `/time` | Current server time |
| `/date` | Current date |
| `/dice` | Roll a dice |
| `/coin` | Flip a coin |
| `/quote` | Random quote |
| `/joke` | Programmer joke |
| `/meme` | Get a meme |
| `/hangman` | Play hangman game |
| `/wordchain <word>` | Play word chain |
| `/quiz` | Take a quiz |

### Gaming Commands
| Command | Description |
|---------|-------------|
| `/score` | Check your points |
| `/daily` | Claim daily reward |
| `/gamble <amount>` | Bet your points |
| `/inventory` | View items |
| `/leaderboard` | Top players |
| `/tictactoe` | Play tic-tac-toe |
| `/chess` | Play chess game |
| `/minesweeper` | Play minesweeper |
| `/2048` | Play 2048 game |
| `/rpsls` | Rock Paper Scissors Lizard Spock |
| `/trivia` | Play trivia game |
| `/answer <text>` | Answer trivia question |

### Utility Commands
| Command | Description |
|---------|-------------|
| `/weather <city>` | Weather info |
| `/calc <expression>` | Calculate expressions |
| `/urlencode <text>` | URL encode |
| `/urldecode <text>` | URL decode |
| `/base64encode <text>` | Base64 encode |
| `/base64decode <text>` | Base64 decode |
| `/poll <question> | <opt>` | Create a poll |
| `/remind <mins> <msg>` | Set reminder |
| `/streak` | Check message streak |
| `/qr <text>` | Generate QR code |
| `/convert <amt> <from> to <to>` | Currency converter |
| `/shorten <url>` | Shorten URL |
| `/summarize <text>` | Summarize text |
| `/mood <text>` | Analyze mood |
| `/ai <prompt>` | Chat with AI |

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Bot API**: node-telegram-bot-api
- **Environment**: dotenv
- **Language**: JavaScript (CommonJS)

## 📁 Project Structure

```
OXION-TELEGRAM-BOT/
├── index.js           # Main bot file
├── package.json       # Dependencies
├── .env.example       # Environment template
├── .env              # Environment variables (not in git)
└── README.md         # Documentation
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from @BotFather | Yes |
| `BOT_OWNER_ID` | Your Telegram user ID for admin commands | No |

### Optional Features

The bot supports auto-reply and user stats tracking out of the box. Configuration can be added in the `CONFIG` object in `index.js`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Oxion**
- GitHub: [@pakyji](https://github.com/pakyji)
- Telegram: @pakyji

## 🙏 Acknowledgments

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - Telegram Bot API wrapper
- [Telegram](https://telegram.org/) - Messaging platform
- All contributors and users

## 📈 Version History

### v2.0.0
- Added Chess mini-game
- Added Minesweeper game
- Added 2048 game
- Added Rock Paper Scissors Lizard Spock
- Added Trivia with categories
- Added QR Code generator
- Added Currency converter
- Added URL shortener
- Added AI Chat simulation
- Added Text summarization
- Added Mood analysis
- Added Admin panel
- Added Group welcome messages
- Added Anti-spam protection
- Fixed syntax errors and bugs
- Updated to 40+ commands

### v1.3.0
- Added JSON database persistence
- Added poll creation feature
- Added reminder system
- Added hangman game
- Added word chain game
- Added quiz command
- Added message streak tracking
- Updated to 30+ commands

### v1.2.0
- Added gaming system (score, daily, gamble, inventory, leaderboard)
- Added utility commands (calc, urlencode/decode, base64)
- Added weather simulation
- Improved user stats tracking

### v1.1.0
- Added 15+ new commands
- Implemented user statistics
- Added auto-reply system
- Enhanced error handling

### v1.0.0
- Initial release
- Basic commands (start, help, echo, ping)

---

⭐ Star this repo if you found it helpful!

Made with ❤️ by Pakyji
