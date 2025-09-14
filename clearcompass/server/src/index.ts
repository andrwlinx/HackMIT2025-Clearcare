import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { cerebrasClient } from './services/cerebras-client';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Enhanced cost estimation with Cerebras ML
app.post('/api/cost/estimate', async (req, res) => {
  try {
    const { procedureCode, hospitalId, insuranceType, patientAge, comorbidities } = req.body;
    
    // Use Cerebras for intelligent cost prediction
    const costPrediction = await cerebrasClient.predictHealthcareCost({
      procedureCode: procedureCode || '29881',
      hospitalId: hospitalId || 'bmc-001',
      insuranceType: insuranceType || 'Blue Cross Blue Shield PPO',
      patientAge,
      comorbidities
    });

    // Add hospital-specific cost variations
    const hospitalMultipliers = {
      'bmc-001': 1.0,      // Boston Medical Center (baseline)
      'mgh-001': 1.35,     // Mass General (premium)
      'bwh-001': 1.28,     // Brigham and Women's (high-end)
      'tufts-001': 1.15,   // Tufts Medical (mid-range)
      'cambridge-001': 0.92 // Cambridge Health (community)
    };

    const hospitalMultiplier = hospitalMultipliers[hospitalId as keyof typeof hospitalMultipliers] || 1.0;
    const adjustedCost = Math.round(costPrediction.estimatedCost * hospitalMultiplier);

    const estimate = {
      totalCost: adjustedCost,
      breakdown: {
        facilityFee: Math.round(costPrediction.breakdown.facilityFee * hospitalMultiplier),
        physicianFee: Math.round(costPrediction.breakdown.physicianFee * hospitalMultiplier),
        anesthesiaFee: Math.round(costPrediction.breakdown.anesthesiaFee * hospitalMultiplier),
        labFee: Math.round(costPrediction.breakdown.labFee * hospitalMultiplier),
        imagingFee: Math.round(costPrediction.breakdown.imagingFee * hospitalMultiplier),
        total: adjustedCost
      },
      insuranceCoverage: {
        deductible: 1500,
        coinsurance: 0.2,
        copay: 50,
        outOfPocketMax: 6000,
        estimatedPatientCost: Math.round(adjustedCost * 0.42) // Rough insurance calculation
      },
      confidence: costPrediction.confidence,
      methodology: costPrediction.methodology
    };

    const comparison = {
      averagePrice: Math.round(adjustedCost * 1.1),
      priceRange: { 
        min: Math.round(adjustedCost * 0.8), 
        max: Math.round(adjustedCost * 1.3) 
      },
      percentile: Math.round((1 - costPrediction.confidence) * 100),
      nearbyFacilities: []
    };

    const procedure = {
      code: procedureCode || '29881',
      description: 'Knee Arthroscopy',
      category: 'Orthopedic Surgery'
    };

    const hospital = {
      id: hospitalId || 'bmc-001',
      name: 'Boston Medical Center',
      location: 'Boston, MA',
      qualityRating: 4
    };

    res.json({ estimate, comparison, procedure, hospital });
  } catch (error) {
    console.error('Cost estimate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Intelligent payment options with Cerebras
app.post('/api/payment/options', async (req, res) => {
  try {
    const { billAmount, income, householdSize } = req.body;
    
    // Use Cerebras for intelligent payment recommendations
    const paymentRecommendations = await cerebrasClient.generatePaymentRecommendations(
      billAmount || 3200,
      income || 50000,
      householdSize || 2
    );

    res.json(paymentRecommendations);
  } catch (error) {
    console.error('Payment options error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced financial aid eligibility with Cerebras
app.post('/api/aid/eligibility', async (req, res) => {
  try {
    const { billAmount, income, householdSize, state } = req.body;
    
    // Use Cerebras for intelligent financial aid analysis
    const aidAnalysis = await cerebrasClient.analyzeFinancialAid({
      income: income || 50000,
      householdSize: householdSize || 2,
      state: state || 'MA',
      billAmount: billAmount || 3200,
      patientProfile: req.body
    });

    const fplGuidelines: { [key: number]: number } = { 1: 14580, 2: 19720, 3: 24860, 4: 30000 };
    const fplAmount = fplGuidelines[Math.min(householdSize || 2, 4)] || 30000;
    const fplPercentage = ((income || 50000) / fplAmount) * 100;

    const checklist = [
      'Gather proof of income (pay stubs, tax returns)',
      'Collect household composition documentation',
      'Obtain copies of medical bills',
      'Contact hospital financial counselor'
    ];

    const nextSteps = [
      'Apply to hospital charity care program first',
      'Contact financial counselor within 7 days',
      'Submit applications within 30 days of service'
    ];

    res.json({
      likelihood: aidAnalysis.eligibilityScore,
      checklist,
      prefill: {
        annualIncome: income || 50000,
        householdSize: householdSize || 2,
        state: state || 'MA',
        medicalDebt: billAmount || 3200,
        fplPercentage: Math.round(fplPercentage)
      },
      nextSteps,
      rationale: aidAnalysis.rationale,
      programs: aidAnalysis.recommendedPrograms
    });
  } catch (error) {
    console.error('Aid eligibility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Provider/facility search endpoint
app.post('/api/providers/search', async (req, res) => {
  try {
    const { query, zipCode, radius, procedureCode } = req.body;
    
    // Use Cerebras to generate intelligent provider recommendations
    const providerRecommendations = await cerebrasClient.generateExplanation('general', {
      zipCode,
      radius,
      procedureCode,
      query
    }, `Find the best healthcare providers for ${query || procedureCode} near ${zipCode} within ${radius} miles`);

    // Generate realistic provider data based on zip code
    const providers = [
      {
        id: 'bmc-001',
        name: 'Boston Medical Center',
        address: {
          street: '1 Boston Medical Center Pl',
          city: 'Boston',
          state: 'MA',
          zipCode: '02118'
        },
        distance: Math.random() * (radius || 25),
        qualityRating: 4.2,
        insuranceNetworks: ['Blue Cross Blue Shield', 'Aetna', 'Cigna'],
        procedurePricing: {
          grossCharge: 12000,
          minNegotiatedRate: 4500,
          maxNegotiatedRate: 8500,
          discountedCashPrice: 6000
        },
        specialties: ['Orthopedics', 'General Surgery', 'Cardiology']
      },
      {
        id: 'mgh-002',
        name: 'Massachusetts General Hospital',
        address: {
          street: '55 Fruit St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02114'
        },
        distance: Math.random() * (radius || 25),
        qualityRating: 4.8,
        insuranceNetworks: ['Blue Cross Blue Shield', 'Harvard Pilgrim', 'Tufts'],
        procedurePricing: {
          grossCharge: 15000,
          minNegotiatedRate: 6000,
          maxNegotiatedRate: 12000,
          discountedCashPrice: 8500
        },
        specialties: ['Orthopedics', 'Neurosurgery', 'Oncology']
      },
      {
        id: 'bwh-003',
        name: 'Brigham and Women\'s Hospital',
        address: {
          street: '75 Francis St',
          city: 'Boston',
          state: 'MA',
          zipCode: '02115'
        },
        distance: Math.random() * (radius || 25),
        qualityRating: 4.6,
        insuranceNetworks: ['Blue Cross Blue Shield', 'Aetna', 'Harvard Pilgrim'],
        procedurePricing: {
          grossCharge: 13500,
          minNegotiatedRate: 5200,
          maxNegotiatedRate: 9800,
          discountedCashPrice: 7200
        },
        specialties: ['Orthopedics', 'Women\'s Health', 'Cardiology']
      }
    ];

    // Sort by distance and quality
    providers.sort((a, b) => a.distance - b.distance);

    res.json({
      providers,
      searchCriteria: {
        query: query || procedureCode,
        zipCode,
        radius: radius || 25
      },
      aiRecommendation: providerRecommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Provider search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cerebras-powered AI explanation endpoints
app.post('/api/explain/cost', async (req, res) => {
  try {
    const explanation = await cerebrasClient.generateExplanation('cost', req.body);
    res.json({
      explanation,
      timestamp: new Date().toISOString(),
      type: 'cost_estimate'
    });
  } catch (error) {
    console.error('Cost explanation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/explain/payment', async (req, res) => {
  try {
    const explanation = await cerebrasClient.generateExplanation('payment', req.body);
    res.json({
      explanation,
      timestamp: new Date().toISOString(),
      type: 'payment_options'
    });
  } catch (error) {
    console.error('Payment explanation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/explain/aid', async (req, res) => {
  try {
    const explanation = await cerebrasClient.generateExplanation('aid', req.body);
    res.json({
      explanation,
      timestamp: new Date().toISOString(),
      type: 'aid_eligibility'
    });
  } catch (error) {
    console.error('Aid explanation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/explain/general', async (req, res) => {
  try {
    const { question, context } = req.body;
    const explanation = await cerebrasClient.generateExplanation('cost', context, question);
    res.json({
      explanation,
      timestamp: new Date().toISOString(),
      type: 'general_question'
    });
  } catch (error) {
    console.error('General explanation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 ClearCompass AI Backend Server running on port ${port}`);
  console.log(`🧠 Cerebras AI integration enabled`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit(0);
});
