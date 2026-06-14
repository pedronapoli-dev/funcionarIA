/** @type {import('next').NextConfig} */
const path = require('path')
const nextConfig = {
  transpilePackages: ['@educarseia/types'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
}

module.exports = nextConfig
