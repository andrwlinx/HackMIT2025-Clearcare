import { useState, useCallback } from 'react';
import { apiClient, ExplanationRequest, ExplanationResponse } from '../lib/api-client';

interface UseAIExplainerState {
  explanation: string | null;
  loading: boolean;
  error: string | null;
}

interface UseAIExplainerReturn extends UseAIExplainerState {
  explainCost: (data: any) => Promise<void>;
  explainPayment: (data: any) => Promise<void>;
  explainAid: (data: any) => Promise<void>;
  askQuestion: (question: string, context?: any) => Promise<void>;
  reset: () => void;
}

export function useAIExplainer(): UseAIExplainerReturn {
  const [state, setState] = useState<UseAIExplainerState>({
    explanation: null,
    loading: false,
    error: null,
  });

  const getExplanation = useCallback(async (request: ExplanationRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiClient.getExplanation(request);
      setState({ explanation: response.explanation, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get explanation';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const explainCost = useCallback(async (data: any) => {
    await getExplanation({ type: 'cost', data });
  }, [getExplanation]);

  const explainPayment = useCallback(async (data: any) => {
    await getExplanation({ type: 'payment', data });
  }, [getExplanation]);

  const explainAid = useCallback(async (data: any) => {
    await getExplanation({ type: 'aid', data });
  }, [getExplanation]);

  const askQuestion = useCallback(async (question: string, context?: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiClient.askGeneralQuestion(question, context);
      setState({ explanation: response.explanation, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get answer';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      explanation: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    explainCost,
    explainPayment,
    explainAid,
    askQuestion,
    reset,
  };
}
