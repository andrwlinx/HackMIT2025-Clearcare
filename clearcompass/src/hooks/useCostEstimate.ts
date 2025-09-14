import { useState, useCallback } from 'react';
import { apiClient, CostEstimateRequest, CostEstimateResponse } from '../lib/api-client';

interface UseCostEstimateState {
  data: CostEstimateResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseCostEstimateReturn extends UseCostEstimateState {
  getCostEstimate: (request: CostEstimateRequest) => Promise<void>;
  compareCosts: (request: {
    procedureCode: string;
    zipCode: string;
    radius?: number;
    insurancePlan?: CostEstimateRequest['insurancePlan'];
  }) => Promise<any>;
  reset: () => void;
}

export function useCostEstimate(): UseCostEstimateReturn {
  const [state, setState] = useState<UseCostEstimateState>({
    data: null,
    loading: false,
    error: null,
  });

  const getCostEstimate = useCallback(async (request: CostEstimateRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiClient.getCostEstimate(request);
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get cost estimate';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const compareCosts = useCallback(async (request: {
    procedureCode: string;
    zipCode: string;
    radius?: number;
    insurancePlan?: CostEstimateRequest['insurancePlan'];
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiClient.compareCosts(request);
      setState(prev => ({ ...prev, loading: false }));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to compare costs';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    getCostEstimate,
    compareCosts,
    reset,
  };
}
