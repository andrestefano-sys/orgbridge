import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@orgbridge/ui', '@orgbridge/auth', '@orgbridge/db'],
}

export default config
