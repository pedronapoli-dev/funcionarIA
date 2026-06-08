import { generate, generateWithTools, parseJsonResponse } from '../lib/anthropic'
import { RECALIBRATE_SYSTEM, recalibratePrompt, type RecalibrateInput } from '../lib/prompts'
import { RECALIBRATE_TOOLS } from '../lib/mcp/supabaseTools'
import { dispatchTool } from '../lib/mcp/registry'
import type { RecalibrateResult } from '@funcionaria/types'

// planId absent  → Phase 1: manual data via generate()
// planId present → Phase 2: Claude fetches plan state from Supabase via MCP
export const runRecalibration = async (input: RecalibrateInput, planId?: string): Promise<RecalibrateResult> => {
  const response = planId
    ? await generateWithTools(
        RECALIBRATE_SYSTEM,
        `${recalibratePrompt(input)}\n\nPlan ID for data retrieval: ${planId}`,
        RECALIBRATE_TOOLS,
        dispatchTool,
        2048,
        3,
      )
    : await generate(RECALIBRATE_SYSTEM, recalibratePrompt(input), 2048)

  return parseJsonResponse<RecalibrateResult>(response, 'recalibração')
}
