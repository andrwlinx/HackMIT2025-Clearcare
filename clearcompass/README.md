# Demo - Healthcare Cost Transparency Platform

A focused healthcare cost estimation demo for knee arthroscopy (CPT 29881) procedures. This application demonstrates transparent pricing, facility comparison, and cost estimation workflows.

## 🎯 Demo Features

- **3-step cost estimation wizard** with insurance plan integration
- **Facility comparison** with quality metrics and pricing
- **Cost breakdown** showing facility and physician fees
- **Network status** indicators (in-network vs out-of-network)
- **Responsive UI** with modern design and UX best practices

## 🏗️ Technical Stack

- **Next.js 14** with TypeScript and App Router
- **Tailwind CSS** for styling
- **Prisma ORM** with PostgreSQL database
- **React Hook Form** with Zod validation
- **Playwright** for end-to-end testing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database

### Installation

1. **Clone and install dependencies:**
```bash
cd clearcompass
npm install
```

2. **Set up environment variables:**
Create a `.env` file with:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/knee_cost_demo"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENCRYPTION_KEY="your-32-character-encryption-key"
```

3. **Initialize database:**
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

4. **Start development server:**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Database Schema

- **User**: Basic user information
- **Facility**: Healthcare facilities with location and quality scores
- **NegotiatedRate**: Pricing data for CPT 29881 procedures
- **Estimate**: Saved cost estimates with breakdown

## 🧮 Estimation Logic

The cost calculation follows healthcare billing practices:

```
AllowedAmount = negotiatedRate.payerAllowed || average(cashPrice, minAllowed, maxAllowed)

PatientCost = 
  if deductibleRemaining > 0:
    min(AllowedAmount, deductibleRemaining) + coinsurance * (AllowedAmount - deductibleRemaining)
  else: 
    coinsurance * AllowedAmount
```

Demo assumptions:
- 20% coinsurance rate
- $100 copay for in-network facilities
- $2,000 annual deductible

## 🎨 UI Pages

- **/** - Hero landing page with feature overview
- **/estimate** - 3-step estimation wizard
- **/compare** - Facility comparison table
- **/dashboard** - Saved estimates (demo data)

## 🧪 Testing

Run Playwright tests:
```bash
npx playwright test
```

## 🔒 Security & Privacy

- No PHI collection - demo uses only basic insurance inputs
- Stubbed authentication for demo purposes
- Clear disclaimers about educational use only

## ⚠️ Demo Limitations

- **Educational purposes only** - not for actual medical decisions
- Sample data for 5 Boston-area facilities
- Hardcoded to CPT 29881 (knee arthroscopy) only
- Mock distance calculations and quality scores

## 📝 Acceptance Criteria

✅ User can get knee arthroscopy estimate in <3 steps  
✅ Compare table lists ≥3 demo facilities  
✅ Breakdown shows facility + physician fees with assumptions  
✅ Responsive design with modern UX  
✅ Clear demo disclaimers throughout

## 🚀 Deployment

The application is ready for deployment on Vercel, Netlify, or similar platforms. Ensure environment variables are configured in your deployment environment.

---

**Note**: This is a demonstration application showcasing healthcare cost transparency concepts. All data is sample/mock data for educational purposes only.
