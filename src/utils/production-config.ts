/**
 * Production-safe configuration for Digital Ocean deployment
 * Disables features that might not work in serverless/containerized environments
 */

export const isProduction = process.env.NODE_ENV === 'production';
export const isDigitalOcean = process.env.DEPLOYMENT_PLATFORM === 'digitalocean';

// Features that should be disabled in production for compatibility
export const productionConfig = {
  // Worker threads may not be available on Digital Ocean App Platform
  enableWorkerThreads: false,
  
  // Sharp processing should be limited in serverless environments
  enableServerSideImageProcessing: false,
  
  // Use simpler optimization strategies
  enableSimpleOptimization: true,
  
  // Disable features that require filesystem access
  enableImageCaching: false,
  
  // Use CDN-based optimization instead
  enableCDNOptimization: true,
};

// Development configuration
export const developmentConfig = {
  enableWorkerThreads: false, // Still disabled for simplicity
  enableServerSideImageProcessing: true,
  enableSimpleOptimization: true,
  enableImageCaching: true,
  enableCDNOptimization: false,
};

export const getConfig = () => {
  return isProduction ? productionConfig : developmentConfig;
};