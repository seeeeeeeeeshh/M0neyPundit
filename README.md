# M0neyPundit - Campus Survival Agent

> Your AI-powered personal CFO for surviving university life financially.

M0neyPundit is a multi-agent AI platform that helps students optimize their money, find deals, discover side hustles, and make smart financial decisions during their campus journey.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)
![React](https://img.shields.io/badge/React-18-61dafb)

## Features

- **💰 AI Financial Agent** - Smart budget analysis, spending insights, and money predictions
- **🎉 Lobang Agent** - Real-time student deals, discounts, and food promotions synced from Telegram
- **🏪 Marketplace Agent** - Buy, sell, borrow, and rent campus items (textbooks, calculators, lab equipment)
- **💼 Side Hustle Agent** - Discover part-time jobs, freelancing, and tutoring opportunities
- **🤖 Multi-Agent Orchestration** - Intelligent chatbot that coordinates all agents to give personalized advice
- **📊 Financial Dashboard** - Track spending by category, budget progress, and daily allowances
- **📱 Mobile-First Design** - Modern, responsive UI optimized for student life

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Charts | Recharts |
| Backend API | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| AI | AGNES AI API (agnes-2.0-flash) |
| Telegram Bot | Python (Telethon) |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **pnpm** (comes with Node.js)
- **Python** 3.9+ (optional, for Telegram sync bot)
- **Supabase account** (free tier available)
- **AGNES API key** (for AI chatbot)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/campus-survival-agent.git
cd campus-survival-agent
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
# Required: AI API Key
AGNES_API_KEY=your_api_key_here

# Required: Supabase (or remove if using only seed data)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Next.js URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Getting Your API Keys

**AGNES API Key:**
- Visit the AGNES AI platform to obtain your API key

**Supabase:**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Project Settings > API to find your URL and keys
4. Run the SQL schema in `supabase/schema.sql` in the SQL Editor

### 4. Install Telegram Bot Dependencies (Optional)

If you want to sync deals from Telegram:

```bash
cd telegram-sync
pip install -r requirements.txt
cd ..
```

## Running the Application

### Development Mode

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Telegram Sync Bot (Optional)

To sync deals from Telegram channels:

1. Create a Telegram API key at [my.telegram.org](https://my.telegram.org)
2. Update `.env` in the `telegram-sync/` folder
3. Run:

```bash
cd telegram-sync
python telegram_sync.py
```

## Project Structure

```
campus-survival-agent/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Homepage (Dashboard)
│   │   ├── chat/               # AI Chat interface
│   │   ├── deals/              # Student deals page
│   │   ├── finances/           # Financial dashboard
│   │   ├── hustles/            # Side hustle opportunities
│   │   ├── marketplace/        # Buy/sell/borrow marketplace
│   │   └── api/                # API routes
│   │       ├── chat/route.ts   # AI chat endpoint
│   │       ├── deals/route.ts  # Deals API
│   │       └── hustles/route.ts # Side hustles API
│   ├── components/             # React components
│   │   ├── FinancialSummary.tsx
│   │   ├── StatsGrid.tsx
│   │   ├── ChatContent.tsx
│   │   └── ...
│   └── lib/                    # Utilities & services
│       ├── agents.ts           # Multi-agent system
│       ├── finances.ts         # Financial data helpers
│       ├── seed-data.ts        # Demo data
│       └── supabase.ts         # Supabase client
├── telegram-sync/              # Python Telegram bot
│   ├── telegram_sync.py
│   └── requirements.txt
├── supabase/
│   └── schema.sql              # Database schema
├── .env.example                # Environment template
├── package.json
└── tailwind.config.ts
```

## How It Works

### Multi-Agent System

The core of M0neyPundit is a multi-agent architecture:

1. **Financial Agent** - Analyzes spending patterns, predicts budget status
2. **Lobang Agent** - Finds deals, discounts, and promotions
3. **Marketplace Agent** - Matches buy/sell/borrow requests
4. **Side Hustle Agent** - Recommends earning opportunities
5. **Orchestrator** - Combines all agent outputs into a unified response

### Chat Interface

The AI chatbot intelligently detects user intent and activates relevant agents:

- "I'm broke" → Financial + Side Hustle agents
- "Find cheap food" → Lobang agent
- "Should I buy or borrow a calculator?" → Marketplace agent
- General queries → All agents collaborate

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AGNES_API_KEY` | Yes | AI model API key |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | No | Your app URL |
| `TELEGRAM_PHONE` | No | Phone for Telegram bot |
| `TELEGRAM_API_HASH` | No | Telegram API hash |
| `TELEGRAM_API_ID` | No | Telegram API ID |

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel settings
5. Click Deploy

### Deploy Telegram Bot

The Telegram sync bot can run on:
- Railway.app
- Render.com
- A VPS or cloud server

## Screenshots

### Dashboard
Shows financial summary, spending charts, and quick action cards

### AI Chat
Conversational interface powered by multi-agent orchestration

### Deals Page
Curated student deals synced from Telegram channels

### Side Hustles
Job and opportunity listings matched to your skills

## Troubleshooting

**AI responses not working?**
- Check that `AGNES_API_KEY` is set in `.env.local`
- Verify the API key is valid

**Deals showing as "Untitled Deal"?**
- The Telegram sync bot may not be running
- Click the refresh button on the Deals page
- Or run `npm run dev` and check the API response

**Build fails?**
- Run `npm run build` to see detailed errors
- Ensure all environment variables are set
- Clear `.next` folder: `rm -rf .next && npm run build`

## License

MIT

## Credits

Built with ❤️ for hackathons and student survival.

- AI Model: AGNES AI
- Platform: Next.js 14
- Database: Supabase
- Styling: Tailwind CSS