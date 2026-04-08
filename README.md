# CORE BRIM TECH OS

An autonomous operating system for founders. Built to run 24/7, minimize costs, and maximize output.

## What It Is

CORE BRIM TECH OS is a comprehensive founder dashboard with 25+ integrated modules:

- **Intelligence**: Founder Brain, Competitor Intel, Deep Research Engine
- **Build**: Hackathon Builder, Auto-Scout
- **Operations**: Goals & OKRs, Session Brain, Focus Mode
- **Money**: Revenue Tracking, Grant Tracker, Invoice Generator
- **Autonomous**: Skill Engine, Away Mode, Scheduler
- **Reports**: Weekly Reports, Investor View, API Cost Optimizer

## Key Features

### 80-90% API Cost Savings
The API Cost Optimizer helps users achieve massive savings through:
- Smart model routing (Haiku/Sonnet/Opus/Gemini)
- Aggressive caching (7-day TTL)
- Background task batching
- Gemini free tier preference
- Budget guardrails with auto-downgrade

### Real Data Only
No mock data. No auto-populated examples. The OS only works with:
- Your tracked grants (not discovery database)
- Your actual clients and pipeline
- Your created goals and milestones
- Your research and decisions

### Autonomous 24/7 Operation
- Background task queue for non-urgent operations
- Automatic cost optimization
- Smart notifications only from real deadlines
- Supabase sync for cross-device persistence

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **AI**: Anthropic Claude + Google Gemini
- **Database**: Supabase (PostgreSQL)
- **State**: localStorage with cloud sync

## Getting Started

1. Clone and install:
```bash
git clone <repo>
cd corebrimtech-os
npm install
```

2. Set up environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
ANTHROPIC_API_KEY=your_claude_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open http://localhost:3000

5. First step: Complete **Founder Brain** setup so the OS knows your company context

## Architecture

![CORE BRIM TECH OS Architecture](/cbt-os-architecture.png)

The OS is built around the **Founder Brain** - the central intelligence that feeds context to all AI-powered modules. Data flows through:

1. **Intelligence Layer** (Claude + Gemini) - AI processing with smart model routing
2. **Founder Brain** - Central company knowledge store
3. **Operations** - Goals, sessions, focus mode, SOPs
4. **Revenue & Grants** - Money tracking and opportunity discovery
5. **API Cost Optimizer** - 80-90% savings through caching and batching
6. **Build & Auto-Scout** - Hackathon builder and opportunity finder
7. **Supabase** - Cloud sync for cross-device persistence

All modules run 24/7 with autonomous background processing.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── brain/             # Founder Brain
│   ├── optimizer/         # API Cost Optimizer
│   ├── money/             # Revenue, Grants, Invoices
│   └── ... (20+ modules)
└── lib/                   # Business logic
    ├── api-optimizer.ts   # Cost optimization engine
    ├── supabase.ts        # Database layer
    ├── founder-brain.ts   # Core company data
    └── ... (20+ modules)
```

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Deployment

Deploy on Vercel:
```bash
vercel --prod
```

Or build and host anywhere:
```bash
npm run build
# Output in .next/ directory
```

## License

Private - Core Brim Tech Internal Use
