import { useState, useCallback } from 'react';
import { apiClient, AidEligibilityRequest, AidEligibilityResponse } from '../lib/api-client';

interface UseFinancialAidState {
  data: AidEligibilityResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseFinancialAidReturn extends UseFinancialAidState {
  checkEligibility: (request: AidEligibilityRequest) => Promise<void>;
  reset: () => void;
}

export function useFinancialAid(): UseFinancialAidReturn {
  const [state, setState] = useState<UseFinancialAidState>({
    data: null,
    loading: false,
    error: null,
  });

  const checkEligibility = useCallback(async (request: AidEligibilityRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiClient.getAidEligibility(request);
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check aid eligibility';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
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
    checkEligibility,
    reset,
  };
}
