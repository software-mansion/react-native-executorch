import { useEffect, useRef, useState } from 'react';

export interface LLMStats {
  ttft: number;
  tokensPerSec: number;
  totalTokens: number;
}

export function useLLMStats(response: string, isGenerating: boolean) {
  const sendTimeRef = useRef<number | null>(null);
  const firstTokenTimeRef = useRef<number | null>(null);
  const lastResponseRef = useRef<string>('');
  const [stats, setStats] = useState<LLMStats | null>(null);

  useEffect(() => {
    if (isGenerating && response.length > 0) {
      lastResponseRef.current = response;
      if (firstTokenTimeRef.current === null && sendTimeRef.current !== null) {
        firstTokenTimeRef.current = Date.now();
      }
    }
  }, [response, isGenerating]);

  useEffect(() => {
    if (
      !isGenerating &&
      sendTimeRef.current !== null &&
      firstTokenTimeRef.current !== null
    ) {
      const endTime = Date.now();
      const ttft = firstTokenTimeRef.current - sendTimeRef.current;
      const totalTime = (endTime - firstTokenTimeRef.current) / 1000;
      const totalTokens = Math.round(lastResponseRef.current.length / 4);
      const tokensPerSec =
        totalTime > 0 ? Math.round(totalTokens / totalTime) : 0;
      setStats({ ttft, tokensPerSec, totalTokens });
      sendTimeRef.current = null;
      firstTokenTimeRef.current = null;
    }
  }, [isGenerating]);

  const onMessageSend = () => {
    sendTimeRef.current = Date.now();
    firstTokenTimeRef.current = null;
    lastResponseRef.current = '';
    setStats(null);
  };

  return { stats, onMessageSend };
}
