/**
 * BotID Protection Component
 * 
 * Provides client-side bot detection and token generation for protected API calls.
 * This component should be included on pages that make API requests requiring bot protection.
 * 
 * SECURITY CONSIDERATIONS:
 * - This runs in the browser and can be modified by malicious actors
 * - Server-side validation is REQUIRED for actual security
 * - Tokens should be regenerated for each session
 * - Failed bot detection should fail securely (assume bot)
 */

import { useEffect, useState } from 'react';
import { initBotId } from '@/lib/bot-protection';

interface BotProtectionState {
  isInitialized: boolean;
  token: string | null;
  error: string | null;
}

export function BotIdProtection() {
  const [state, setState] = useState<BotProtectionState>({
    isInitialized: false,
    token: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const initializeBotProtection = async () => {
      try {
        console.log('Initializing bot protection...');
        
        // Initialize bot detection
        const token = await initBotId();
        
        if (!mounted) return;

        if (token) {
          setState({
            isInitialized: true,
            token,
            error: null,
          });
          console.log('Bot protection initialized successfully');
        } else {
          // Failed to generate token - fail securely
          setState({
            isInitialized: true,
            token: null,
            error: 'Bot detection failed - API requests will be blocked',
          });
          console.warn('Bot protection initialization failed');
        }
      } catch (error) {
        if (!mounted) return;
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState({
          isInitialized: true,
          token: null,
          error: `Bot protection error: ${errorMessage}`,
        });
        console.error('Bot protection initialization error:', error);
      }
    };

    // Initialize on component mount
    initializeBotProtection();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  // Provide global access to bot protection status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Expose bot protection status globally for API calls
      (window as any).botProtection = {
        isInitialized: state.isInitialized,
        hasValidToken: !!state.token,
        getToken: () => state.token,
        getHeaders: () => {
          if (!state.token) return {};
          
          const botData = sessionStorage.getItem('botcheck_data');
          return {
            'X-Bot-Token': state.token,
            'X-Bot-Data': botData || '{}',
          };
        },
      };
    }
  }, [state]);

  // This component doesn't render anything - it's purely functional
  return null;
}

/**
 * Helper function to get bot protection headers for API calls
 * 
 * Usage:
 * ```typescript
 * const headers = getBotProtectionHeaders();
 * if (!headers) {
 *   // Bot protection not initialized or failed
 *   throw new Error('Bot protection required');
 * }
 * 
 * fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     ...headers,
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function getBotProtectionHeaders(): Record<string, string> | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  const botProtection = (window as any).botProtection;
  if (!botProtection?.hasValidToken) {
    return null;
  }

  return botProtection.getHeaders();
}

/**
 * Check if bot protection is ready for API calls
 */
export function isBotProtectionReady(): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering
  }

  const botProtection = (window as any).botProtection;
  return botProtection?.isInitialized && botProtection?.hasValidToken;
}

export default BotIdProtection;