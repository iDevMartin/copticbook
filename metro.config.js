const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle @vercel/analytics exports
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Handle @vercel/analytics/react import
    if (moduleName === '@vercel/analytics/react') {
      const analyticsPath = path.resolve(__dirname, 'node_modules/@vercel/analytics/dist/react/index.js');
      return {
        filePath: analyticsPath,
        type: 'sourceFile',
      };
    }

    // Default resolver
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
