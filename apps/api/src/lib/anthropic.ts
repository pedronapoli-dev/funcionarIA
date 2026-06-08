import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
export const MODEL = 'claude-sonnet-4-6'

export const parseJsonResponse = <T>(response: string, label: string): T => {
  try { return JSON.parse(response) as T }
  catch { throw new Error(`Falha ao parsear ${label} da IA. Tente novamente.`) }
}

export const generate = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096
): Promise<string> => {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })
  logUsage('generate', message.usage)
  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Resposta inesperada da API')
  return stripCodeFences(block.text)
}

// Agentic loop with tool_use support.
// Each tool call re-sends the full conversation — use sparingly.
// maxIterations caps the number of round-trips to control cost.
export const generateWithTools = async (
  systemPrompt: string,
  userPrompt: string,
  tools: Anthropic.Tool[],
  toolExecutor: (name: string, input: unknown) => Promise<unknown>,
  maxTokens: number,
  maxIterations = 4
): Promise<string> => {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userPrompt },
  ]

  for (let i = 0; i < maxIterations; i++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      tools,
      messages,
    })
    logUsage(`generateWithTools:iter${i + 1}`, response.usage)

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') throw new Error('Resposta inesperada da API')
      return stripCodeFences(textBlock.text)
    }

    if (response.stop_reason !== 'tool_use') break

    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const results = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const output = await toolExecutor(block.name, block.input)
        return { type: 'tool_result' as const, tool_use_id: block.id, content: JSON.stringify(output) }
      })
    )

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: results })
  }

  throw new Error('generateWithTools: limite de iterações atingido sem resposta final')
}

const logUsage = (label: string, usage: Anthropic.Usage): void => {
  const cost = (usage.input_tokens * 3 + usage.output_tokens * 15) / 1_000_000
  console.info(`[AI] ${label} — in: ${usage.input_tokens} | out: ${usage.output_tokens} | ~$${cost.toFixed(5)}`)
}

const stripCodeFences = (text: string): string => {
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  if (stripped !== text.trim() && looksLikeJSON(stripped)) return stripped

  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) return fenceMatch[1].trim()

  const objStart = text.indexOf('{')
  const arrStart = text.indexOf('[')

  if (objStart === -1 && arrStart === -1) return text.trim()

  if (arrStart !== -1 && (objStart === -1 || arrStart < objStart)) {
    const lastBracket = text.lastIndexOf(']')
    if (lastBracket > arrStart) return text.slice(arrStart, lastBracket + 1)
  }

  if (objStart !== -1) {
    const lastBrace = text.lastIndexOf('}')
    if (lastBrace > objStart) return text.slice(objStart, lastBrace + 1)
  }

  return text.trim()
}

const looksLikeJSON = (text: string): boolean => {
  const t = text.trimStart()
  return t.startsWith('{') || t.startsWith('[')
}
