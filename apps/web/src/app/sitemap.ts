import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

const sitemap = (): MetadataRoute.Sitemap => {
  const routes = ['', '/planos', '/termos', '/privacidade', '/login']

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }))
}

export default sitemap
