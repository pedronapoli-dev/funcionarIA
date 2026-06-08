// ============================================================
// @funcionaria/prompts
// Prompts centralizados da IA — versionados separadamente.
//
// Este pacote é a fonte canônica de todos os prompts.
// apps/api/src/lib/prompts.ts deve ser mantido em sincronia.
//
// Versionar mudanças de prompt sem tocar no código de infra.
// Fundamento teórico: Freire, Piaget, Vygotsky, Bloom,
//   Darcy Ribeiro, Sweller, Ebbinghaus.
// ============================================================

export { PROMPTS_VERSION } from './prompts'
export * from './prompts'
export * from './router'
