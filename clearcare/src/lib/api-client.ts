// API Client for Cost & Aid AI Engine
export interface CostEstimateRequest {
  procedureCode: string;
  hospitalId: string;
  insurancePlan?: {
    planType: string;
    deductible: number;
    coinsurance: number;
    copay: number;
    outOfPocketMax: number;
    network: string;
  };
  patientInfo?: {
    age: number;
    zipCode: string;
    comorbidities: string[];
  };
}

export interface CostEstimateResponse {
  estimate: {
    totalCost: number;
    breakdown: {
      facilityFee: number;
      physicianFee: number;
      anesthesiaFee?: number;
      labFee?: number;
      imagingFee?: number;
    };
    insuranceCoverage?: {
      deductible: number;
      coinsurance: number;
      copay: number;
      outOfPocketMax: number;
      estimatedPatientCost: number;
    };
    confidence: number;
    methodology: string;
  };
  comparison: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    percentile: number;
    nearbyFacilities: Array<{
      hospitalId: string;
      name: string;
      price: number;
      distance: number;
    }>;
  };
  procedure: {
    code: string;
    description: string;
    category: string;
  };
  hospital: {
    id: string;
    name: string;
    location: string;
    qualityRating?: number;
  };
}

export interface PaymentOptionsRequest {
  billAmount: number;
  income: number;
  householdSize: number;
  monthlyBudget?: number;
  creditBand?: 'thin' | 'fair' | 'good' | 'prime';
}

export interface PaymentOptionsResponse {
  options: Array<{
    label: string;
    months?: number;
    apr?: number;
    monthlyPayment: number;
    totalPaid: number;
    pros: string[];
    cons: string[];
    risk: 'low' | 'medium' | 'high';
  }>;
  rationale: string;
}

export interface AidEligibilityRequest {
  billAmount: number;
  income: number;
  householdSize: number;
  state: string;
  hospitalId: string;
}

export interface AidEligibilityResponse {
  likelihood: number;
  checklist: string[];
  prefill: Record<string, string | number | boolean>;
  nextSteps: string[];
  rationale: string;
  programs: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    coverage: string;
    requirements: string[];
    applicationUrl?: string;
    priority: number;
  }>;
}

export interface ProviderSearchRequest {
  query: string;
  location?: { lat: number; lng: number };
  zipCode?: string;
  radius?: number;
  procedureCode?: string;
  insuranceNetwork?: string;
  facilityType?: 'hospital' | 'clinic' | 'surgery_center' | 'imaging' | 'lab';
  limit?: number;
}

export interface ProviderSearchResponse {
  providers: Array<{
    id: string;
    name: string;
    facilityType: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    location: { lat: number; lng: number };
    distance?: number;
    phone: string;
    website?: string;
    qualityRating?: number;
    specialties: string[];
    insuranceNetworks: string[];
    procedurePricing?: {
      grossCharge: number;
      discountedCashPrice?: number;
      minNegotiatedRate?: number;
      maxNegotiatedRate?: number;
    };
    features: {
      emergencyServices: boolean;
      parkingAvailable: boolean;
      publicTransit: boolean;
      wheelchairAccessible: boolean;
    };
  }>;
  total: number;
  searchCriteria: ProviderSearchRequest;
}

export interface ExplanationRequest {
  type: 'cost' | 'payment' | 'aid';
  data: any;
}

export interface ExplanationResponse {
  explanation: string;
  timestamp: string;
  type: string;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Cost estimation endpoints
  async getCostEstimate(request: CostEstimateRequest): Promise<CostEstimateResponse> {
    return this.request<CostEstimateResponse>('/cost/estimate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async compareCosts(request: {
    procedureCode: string;
    zipCode: string;
    radius?: number;
    insurancePlan?: CostEstimateRequest['insurancePlan'];
  }): Promise<{
    facilities: Array<{
      hospitalId: string;
      name: string;
      location: string;
      estimate: CostEstimateResponse['estimate'];
      distance: number;
    }>;
    summary: {
      averagePrice: number;
      priceRange: { min: number; max: number };
      savingsOpportunity: number;
    };
  }> {
    return this.request('/cost/compare', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  
  // Financial aid endpoints
  async getAidEligibility(request: AidEligibilityRequest): Promise<AidEligibilityResponse> {
    return this.request<AidEligibilityResponse>('/aid/eligibility', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Provider search endpoints
  async searchProviders(request: ProviderSearchRequest): Promise<ProviderSearchResponse> {
    return this.request<ProviderSearchResponse>('/providers/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getProvider(id: string): Promise<{
    id: string;
    name: string;
    facilityType: string;
    address: any;
    location: { lat: number; lng: number };
    phone: string;
    website?: string;
    qualityRating?: number;
    specialties: string[];
    insuranceNetworks: string[];
    qualityMetrics: any;
    reviews: any[];
    pricing: any[];
    pricingCount: number;
  }> {
    return this.request(`/providers/${id}`);
  }

  async getProviderPricing(
    id: string,
    options: {
      search?: string;
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    pricing: any[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/providers/${id}/pricing${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // AI explanation endpoints
  async getExplanation(request: ExplanationRequest): Promise<ExplanationResponse> {
    const endpoint = `/explain/${request.type}`;
    return this.request<ExplanationResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(request.data),
    });
  }

  async askGeneralQuestion(question: string, context?: any): Promise<ExplanationResponse> {
    return this.request<ExplanationResponse>('/explain/general', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    });
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Export for testing or custom configurations
export { APIClient };
