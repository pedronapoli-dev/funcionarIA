import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import jwt, { type FastifyJWTOptions } from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'

interface JwkKey {
  kty: string
  alg?: string
  crv?: string
  kid?: string
  [key: string]: unknown
}

// Matches the 2-arg async Secret variant from @fastify/jwt (request, tokenOrHeader)
interface JwtTokenOrHeader {
  header: { alg?: string; kid?: string; [key: string]: unknown }
  payload?: unknown
}

import { plansRoutes }     from './routes/plans'
import { subjectsRoutes }  from './routes/subjects'
import { exercisesRoutes } from './routes/exercises'
import { webhookRoutes }   from './routes/webhook'
import { skillsRoutes }    from './routes/skills'
import { authPlugin }      from './plugins/auth'

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

// Cache: kid → PEM para não buscar JWKS a cada request
const keyCache = new Map<string, string>()

async function getPublicKeyPem(kid?: string): Promise<string> {
  const cacheKey = kid ?? '__default__'
  if (keyCache.has(cacheKey)) return keyCache.get(cacheKey)!

  const jwksUrl = `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`
  const res = await fetch(jwksUrl, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY! },
  })
  if (!res.ok) throw new Error(`Falha ao buscar JWKS: ${res.status}`)

  const { keys } = await res.json() as { keys: JwkKey[] }
  const jwk = (kid ? keys.find((k: JwkKey) => k.kid === kid) : null) ?? keys[0]
  if (!jwk) throw new Error('Chave pública não encontrada no JWKS')

  // Detecta o algoritmo pela curva ou pelo campo 'alg' do JWK
  const isEC = jwk.kty === 'EC' || jwk.crv === 'P-256' || jwk.alg === 'ES256'

  // crypto.subtle é a Web Crypto API — nativa no Node 20+, sem imports necessários
  const cryptoKey: globalThis.CryptoKey = await (
    isEC
      // ECDSA P-256 — formato novo do Supabase
      ? crypto.subtle.importKey(
          'jwk',
          jwk,
          { name: 'ECDSA', namedCurve: 'P-256' },
          true,
          ['verify']
        )
      // RSASSA-PKCS1-v1_5 — formato legado
      : crypto.subtle.importKey(
          'jwk',
          jwk,
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          true,
          ['verify']
        )
  )

  const exported = await crypto.subtle.exportKey('spki', cryptoKey)
  const b64      = Buffer.from(exported).toString('base64')
  const pem      = `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----`

  keyCache.set(cacheKey, pem)
  return pem
}

async function bootstrap() {
  await server.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await server.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  })

  // Suporta ES256 (novo Supabase) e RS256 (legado) automaticamente.
  // The secret callback uses @fastify/jwt's 2-arg async Secret variant;
  // cast is required because TypeScript resolves fast-jwt's KeyFetcher (1-arg) first.
  const jwtSecret = (async (_req: unknown, token: JwtTokenOrHeader) => {
    const alg = token.header.alg
    if (alg !== 'ES256' && alg !== 'RS256') {
      throw new Error(`Algoritmo não suportado: ${alg}`)
    }
    return getPublicKeyPem(token.header.kid)
  }) as FastifyJWTOptions['secret']
  await server.register(jwt, {
    secret: jwtSecret,
    decode: { complete: true },
    verify:  { algorithms: ['ES256', 'RS256'] },
  })

  await server.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
  })

  await server.register(authPlugin)
  await server.register(plansRoutes,     { prefix: '/api/plans' })
  await server.register(subjectsRoutes,  { prefix: '/api/subjects' })
  await server.register(exercisesRoutes, { prefix: '/api/exercises' })
  await server.register(webhookRoutes,   { prefix: '/api/webhooks' })
  await server.register(skillsRoutes,    { prefix: '/api/skills' })

  server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  const port = Number(process.env.PORT ?? 3001)
  await server.listen({ port, host: '0.0.0.0' })
  server.log.info(`FuncionarIA API rodando em http://localhost:${port}`)
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })