/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // Set basePath for GitHub Pages deployment
  // Change 'DocRedactor' to your actual repository name
  basePath: process.env.NODE_ENV === 'production' ? '/DocRedactor' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/DocRedactor/' : '',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@xenova/transformers'],
  webpack: (config, { isServer }) => {
    // Handle pdf.js worker
    config.resolve.alias.canvas = false;
    
    // CRITICAL: Completely replace onnxruntime-node with empty module
    // This prevents the module from being bundled at all
    config.resolve.alias = {
      ...config.resolve.alias,
      'onnxruntime-node$': require.resolve('./lib/empty-module.js'),
      'sharp': false,
    };
    
    // Configure for transformers.js - all Node.js modules should be false
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      'node:fs': false,
      'node:path': false,
      'node:crypto': false,
      'node:os': false,
      'node:url': false,
      perf_hooks: false,
    };

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

module.exports = nextConfig;
