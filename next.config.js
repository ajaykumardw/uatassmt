/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true,
        locale: false
      }
    ]
  },
  // output: 'export',
  rewrites: async () => {
    return [
      {
        source: '/storage/uploads/:path*',
        destination: '/api/uploads/:path*'
      }
    ]
  },

  // TODO: below line is added to resolve twice event dispatch in the calendar reducer
  reactStrictMode: false,

  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/system',
      'date-fns',
      'lodash',
      'recharts',
      'apexcharts'
    ]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  productionBrowserSourceMaps: false,

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false
    }
    return config
  }
}

module.exports = nextConfig
