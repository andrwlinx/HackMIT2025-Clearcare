# ClearCare

A simple healthcare cost transparency tool that helps patients understand medical pricing before they get care.

## What it does

Medical bills are confusing and expensive. ClearCare shows you:
- How much procedures actually cost at different hospitals
- What you'll pay after insurance
- Financial aid programs you might qualify for

## How it works

We have three parts:

**Frontend (React website)**: Where you enter your insurance info and see cost estimates
**Backend (Node.js server)**: Processes hospital pricing data and calculates your costs  
**Cerebras AI**: Makes the cost predictions smarter and finds financial aid options

## Getting started

Need Node.js and Cerebras API key.

```bash
git clone <this-repo>
cd hackmitreal

# Start the website
cd clearcare
npm install
npm run dev

# Start the backend (new terminal)
cd clearcare/server  
npm install
npm run dev
```

Website: http://localhost:3000
Backend: http://localhost:3001

## Features

- **Multiple procedure types**: Knee Arthroscopy, MRI Scan, Colonoscopy, CT Scan, Emergency Room Visit
- **Hospital-specific pricing**: Costs vary realistically between different hospitals
- **Dynamic cost estimates**: Powered by Cerebras AI with procedure-specific calculations
- **Real CPT codes**: Uses actual medical billing codes (29881, 73721, 45378, etc.)
- **Insurance integration**: Calculates your actual out-of-pocket costs
- **Financial aid matching**: AI-powered program recommendations

## The problem we're solving

Hospital pricing is a mess:
- Every hospital publishes prices differently
- The data files are huge and confusing
- Half the time prices are missing or wrong
- Patients have no idea what they'll actually pay

## Our solution

1. **Collect real pricing data** from hospital transparency files
2. **Clean and organize** the messy data 
3. **Calculate actual costs** based on your specific insurance
4. **Use AI** to predict missing prices and find financial aid
5. **Show simple results** so you can make informed decisions

## What makes it smart

**Cerebras AI integration**: We use Cerebras LLaMA 3.1-70B to:
- Predict costs when hospital data is incomplete
- Analyze your financial situation 
- Match you with relevant aid programs
- Explain everything in plain English
- Provide procedure-specific cost breakdowns

## Environment setup

Backend needs a `.env` file in  `clearcare/server/`:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
FRONTEND_URL=http://localhost:3000

# Cerebras AI Configuration
CEREBRAS_API_KEY=your_cerebras_api_key_here
```

Frontend needs `.env.local` in `clearcare/`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## File structure

```
clearcare/
├── src/app/              # React pages and components
├── server/               # Node.js backend
│   ├── src/services/     # Business logic and AI
│   ├── scripts/          # Data processing
│   └── prisma/           # Database
```

## What's next

If we had more time:
- Better data coverage from more hospitals
- Real-time insurance verification
- Mobile app for price checking
- Integration with appointment booking

## Technical notes

Built with TypeScript, Next.js, Express, and Prisma. Uses Cerebras AI for intelligent predictions and recommendations.

## Running in production

Don't. This is hackathon code.
