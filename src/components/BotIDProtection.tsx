import { useEffect } from 'react';

declare global {
  interface Window {
    initBotId?: () => Promise<void>;
  }
}

export function BotIDProtection() {
  useEffect(() => {
    const initializeBotId = async () => {
      try {
        // Dynamically import botid to avoid SSR issues
        const { initBotId } = await import('botid');
        
        // Initialize BotID client-side protection
        await initBotId();
        
        console.log('BotID protection initialized');
      } catch (error) {
        // Fail silently - don't break the site if BotID fails to load
        console.warn('BotID initialization failed:', error);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      initializeBotId();
    }
  }, []);

  // This component doesn't render anything visible
  return null;
}