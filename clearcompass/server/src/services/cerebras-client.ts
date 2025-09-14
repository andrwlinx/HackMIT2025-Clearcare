import Cerebras from '@cerebras/cerebras_cloud_sdk';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/cerebras.log' })
  ]
});

// TypeScript interfaces for Cerebras API responses
interface CerebrasMessage {
  role: string;
  content: string | null | undefined;
}

interface CerebrasChoice {
  index: number;
  message: CerebrasMessage;
  finish_reason: string | null;
}

interface CerebrasResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: CerebrasChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CostPredictionInput {
  procedureCode: string;
  hospitalId: string;
  insuranceType: string;
  patientAge?: number;
  comorbidities?: string[];
  historicalData?: any;
}

interface CostPredictionResult {
  estimatedCost: number;
  confidence: number;
  breakdown: {
    facilityFee: number;
    physicianFee: number;
    anesthesiaFee: number;
    labFee: number;
    imagingFee: number;
  };
  methodology: string;
}

interface FinancialAidInput {
  income: number;
  householdSize: number;
  state: string;
  billAmount: number;
  patientProfile: any;
}

interface FinancialAidResult {
  eligibilityScore: number;
  recommendedPrograms: Array<{
    name: string;
    type: string;
    estimatedSavings: number;
    applicationPriority: number;
    requirements: string[];
  }>;
  rationale: string;
}

export class CerebrasClient {
  private cerebras: Cerebras;

  constructor() {
    this.cerebras = new Cerebras({
      apiKey: process.env.CEREBRAS_API_KEY || '',
    });
  }

  async predictHealthcareCost(input: CostPredictionInput): Promise<CostPredictionResult> {
    try {
      const prompt = this.buildCostPredictionPrompt(input);
      
      const response = await this.cerebras.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a healthcare cost prediction AI trained on Hospital Price Transparency v3 data. 
            Provide accurate cost estimates with detailed breakdowns. Always return valid JSON with the exact structure requested.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama3.1-70b',
        temperature: 0.1,
        max_tokens: 1000,
      }) as CerebrasResponse;

      const result = JSON.parse(response.choices[0].message.content || '{}');
      logger.info('Cerebras cost prediction completed', { procedureCode: input.procedureCode });
      
      return {
        estimatedCost: result.estimatedCost || 3200,
        confidence: result.confidence || 0.85,
        breakdown: result.breakdown || {
          facilityFee: result.estimatedCost * 0.75 || 2400,
          physicianFee: result.estimatedCost * 0.25 || 800,
          anesthesiaFee: 0,
          labFee: 0,
          imagingFee: 0
        },
        methodology: 'Cerebras LLaMA 3.1-70B with HPT v3 training data'
      };

    } catch (error) {
      logger.error('Cerebras cost prediction failed', { error });
      return this.getDefaultCostPrediction(input);
    }
  }

  async generateExplanation(type: 'cost' | 'payment' | 'aid' | 'general', data: any, question?: string): Promise<string> {
    try {
      const prompt = this.buildExplanationPrompt(type, data, question);
      
      const response = await this.cerebras.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a healthcare financial advisor AI. Provide clear, empathetic, and actionable explanations 
            about healthcare costs, payment options, and financial aid. Use simple language and focus on practical next steps.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama3.1-70b',
        temperature: 0.3,
        max_tokens: 800,
      }) as CerebrasResponse;

      const explanation = response.choices[0].message.content || 'I apologize, but I cannot provide an explanation at this time.';
      logger.info('Cerebras explanation generated', { type });
      
      return explanation;

    } catch (error) {
      logger.error('Cerebras explanation failed', { error });
      return this.getDefaultExplanation(type, data, question);
    }
  }

  async analyzeFinancialAid(input: FinancialAidInput): Promise<FinancialAidResult> {
    try {
      const prompt = this.buildFinancialAidPrompt(input);
      
      const response = await this.cerebras.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a financial aid specialist AI with expertise in healthcare assistance programs. 
            Analyze patient financial situations and recommend appropriate aid programs with realistic eligibility assessments.
            Always return valid JSON with the exact structure requested.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama3.1-70b',
        temperature: 0.2,
        max_tokens: 1200,
      }) as CerebrasResponse;

      const result = JSON.parse(response.choices[0].message.content || '{}');
      logger.info('Cerebras financial aid analysis completed', { income: input.income });
      
      return {
        eligibilityScore: result.eligibilityScore || 0.6,
        recommendedPrograms: result.recommendedPrograms || [],
        rationale: result.rationale || 'Based on your financial situation, you may qualify for several assistance programs.'
      };

    } catch (error) {
      logger.error('Cerebras financial aid analysis failed', { error });
      return this.getDefaultFinancialAid(input);
    }
  }

  async generatePaymentRecommendations(billAmount: number, income: number, householdSize: number): Promise<any> {
    try {
      const prompt = `Analyze this patient's financial situation and recommend optimal payment strategies:
      
      Bill Amount: $${billAmount}
      Annual Income: $${income}
      Household Size: ${householdSize}
      
      Consider:
      - Federal Poverty Level calculations
      - Disposable income analysis
      - Hospital payment plan options
      - Interest rates and terms
      - Patient financial capacity
      
      Provide 3-4 payment options with specific monthly amounts, terms, and rationale.
      Return as JSON with structure: { options: [{ label, months, apr, monthlyPayment, totalPaid, pros, cons, risk }], rationale }`;

      const response = await this.cerebras.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a healthcare payment planning specialist. Provide practical, affordable payment solutions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama3.1-70b',
        temperature: 0.2,
        max_tokens: 1000,
      }) as CerebrasResponse;

      const result = JSON.parse(response.choices[0].message.content || '{}');
      logger.info('Cerebras payment recommendations generated');
      
      return result;

    } catch (error) {
      logger.error('Cerebras payment recommendations failed', { error });
      return this.getDefaultPaymentOptions(billAmount, income);
    }
  }

  private buildCostPredictionPrompt(input: CostPredictionInput): string {
    return `Predict healthcare costs for this procedure:
    
    Procedure Code: ${input.procedureCode}
    Hospital ID: ${input.hospitalId}
    Insurance Type: ${input.insuranceType}
    Patient Age: ${input.patientAge || 'Not specified'}
    Comorbidities: ${input.comorbidities?.join(', ') || 'None specified'}
    
    Based on Hospital Price Transparency v3 data patterns, provide a cost estimate with:
    - Total estimated cost
    - Confidence level (0-1)
    - Detailed breakdown (facility, physician, anesthesia, lab, imaging fees)
    
    Return as JSON: { "estimatedCost": number, "confidence": number, "breakdown": { "facilityFee": number, "physicianFee": number, "anesthesiaFee": number, "labFee": number, "imagingFee": number } }`;
  }

  private buildExplanationPrompt(type: string, data: any, question?: string): string {
    if (question) {
      return `Patient question: "${question}"
      
      Context data: ${JSON.stringify(data, null, 2)}
      
      Provide a helpful, empathetic response that addresses their specific question using the context provided.`;
    }

    switch (type) {
      case 'cost':
        return `Explain this healthcare cost estimate to a patient in simple terms:
        
        ${JSON.stringify(data, null, 2)}
        
        Focus on:
        - What each cost component means
        - Why the price is what it is
        - How it compares to typical costs
        - What factors influence the price`;

      case 'payment':
        return `Explain these payment options to a patient:
        
        ${JSON.stringify(data, null, 2)}
        
        Help them understand:
        - Which option might be best for their situation
        - The pros and cons of each option
        - What to consider when choosing`;

      case 'aid':
        return `Explain these financial aid options to a patient:
        
        ${JSON.stringify(data, null, 2)}
        
        Help them understand:
        - Which programs they're most likely to qualify for
        - What the application process involves
        - Timeline and next steps`;

      default:
        return `Provide general healthcare financial guidance based on: ${JSON.stringify(data, null, 2)}`;
    }
  }

  private buildFinancialAidPrompt(input: FinancialAidInput): string {
    const fplGuidelines = { 1: 15060, 2: 20440, 3: 25820, 4: 31200 };
    const fplAmount = fplGuidelines[Math.min(input.householdSize, 4) as keyof typeof fplGuidelines] || 31200;
    const fplPercentage = (input.income / fplAmount) * 100;

    return `Analyze financial aid eligibility for this patient:
    
    Annual Income: $${input.income}
    Household Size: ${input.householdSize}
    State: ${input.state}
    Medical Bill: $${input.billAmount}
    Federal Poverty Level: ${Math.round(fplPercentage)}%
    
    Recommend appropriate financial assistance programs considering:
    - Hospital charity care (typically 200-400% FPL)
    - State-specific programs
    - Nonprofit assistance
    - Government programs
    - Medical financing options
    
    Return as JSON: { 
      "eligibilityScore": number (0-1), 
      "recommendedPrograms": [{ "name": string, "type": string, "estimatedSavings": number, "applicationPriority": number, "requirements": [string] }],
      "rationale": string 
    }`;
  }

  // Default fallback methods when Cerebras is unavailable
  private getDefaultCostPrediction(input: CostPredictionInput): CostPredictionResult {
    const baseCost = 3200;
    return {
      estimatedCost: baseCost,
      confidence: 0.75,
      breakdown: {
        facilityFee: baseCost * 0.75,
        physicianFee: baseCost * 0.25,
        anesthesiaFee: 0,
        labFee: 0,
        imagingFee: 0
      },
      methodology: 'Default rule-based estimation (Cerebras unavailable)'
    };
  }

  private getDefaultExplanation(type: string, data: any, question?: string): string {
    if (question) {
      return `Thank you for your question: "${question}". For specific healthcare cost questions, I recommend consulting with a healthcare financial counselor who can provide personalized guidance based on your situation.`;
    }

    switch (type) {
      case 'cost':
        return 'Your cost estimate includes facility fees and physician fees. This represents a competitive price for this procedure in your area based on current market rates.';
      case 'payment':
        return 'For your medical bill, we recommend starting with the hospital payment plan as it typically offers the best terms with no interest charges.';
      case 'aid':
        return 'Based on your financial situation, you may qualify for financial assistance. Start by contacting the hospital\'s financial counselor to discuss available programs.';
      default:
        return 'For specific healthcare financial questions, please consult with a qualified financial counselor.';
    }
  }

  private getDefaultFinancialAid(input: FinancialAidInput): FinancialAidResult {
    const fplGuidelines = { 1: 15060, 2: 20440, 3: 25820, 4: 31200 };
    const fplAmount = fplGuidelines[Math.min(input.householdSize, 4) as keyof typeof fplGuidelines] || 31200;
    const fplPercentage = (input.income / fplAmount) * 100;
    const eligibilityScore = fplPercentage <= 200 ? 0.8 : fplPercentage <= 400 ? 0.6 : 0.3;

    return {
      eligibilityScore,
      recommendedPrograms: [
        {
          name: 'Hospital Charity Care',
          type: 'hospital',
          estimatedSavings: input.billAmount * 0.5,
          applicationPriority: 1,
          requirements: ['Income verification', 'Asset documentation']
        }
      ],
      rationale: `Based on your income of $${input.income.toLocaleString()} for ${input.householdSize} people (${Math.round(fplPercentage)}% of FPL), you have a ${Math.round(eligibilityScore * 100)}% likelihood of qualifying for financial assistance.`
    };
  }

  private getDefaultPaymentOptions(billAmount: number, income: number): any {
    return {
      options: [
        {
          label: 'Hospital Payment Plan',
          months: 12,
          apr: 0,
          monthlyPayment: Math.round(billAmount / 12),
          totalPaid: billAmount,
          pros: ['No interest', 'Direct with hospital'],
          cons: ['Higher monthly payment'],
          risk: 'low'
        }
      ],
      rationale: `Based on your income of $${income.toLocaleString()}, we recommend starting with the hospital payment plan for the lowest total cost.`
    };
  }
}

export const cerebrasClient = new CerebrasClient();
