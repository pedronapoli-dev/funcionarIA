/** @type {import('next').NextConfig} */
const path = require('path')
const nextConfig = {
  transpilePackages: ['@funcionaria/types'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
}

module.exports = nextConfig
