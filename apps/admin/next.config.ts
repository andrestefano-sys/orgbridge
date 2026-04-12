import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@orgbridge/ui', '@orgbridge/db'],
}

export default config
