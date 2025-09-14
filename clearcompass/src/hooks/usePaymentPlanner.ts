import { useState, useCallback } from 'react';
import { apiClient, PaymentOptionsRequest, PaymentOptionsResponse } from '../lib/api-client';

interface UsePaymentPlannerState {
  data: PaymentOptionsResponse | null;
  loading: boolean;
  error: string | null;
}

interface UsePaymentPlannerReturn extends UsePaymentPlannerState {
  getPaymentOptions: (request: PaymentOptionsRequest) => Promise<void>;
  reset: () => void;
}

export function usePaymentPlanner(): UsePaymentPlannerReturn {
  const [state, setState] = useState<UsePaymentPlannerState>({
    data: null,
    loading: false,
    error: null,
  });

  const getPaymentOptions = useCallback(async (request: PaymentOptionsRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiClient.getPaymentOptions(request);
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get payment options';
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
    getPaymentOptions,
    reset,
  };
}
