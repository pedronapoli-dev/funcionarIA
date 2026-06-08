import { generate, generateWithTools, parseJsonResponse } from '../lib/anthropic'
import { CHECKIN_SYSTEM, checkinPrompt, type CheckinInput } from '../lib/prompts'
import { CHECKIN_TOOLS } from '../lib/mcp/supabaseTools'
import { dispatchTool } from '../lib/mcp/registry'
import type { PlanCheckin } from '@funcionaria/types'

// planId absent  → Phase 1: uses manually provided data via generate()
// planId present → Phase 2: Claude fetches real session data from Supabase via MCP
export const runCheckin = async (input: CheckinInput, planId?: string): Promise<PlanCheckin> => {
  const response = planId
    ? await generateWithTools(
        CHECKIN_SYSTEM,
        `${checkinPrompt(input)}\n\nPlan ID for data retrieval: ${planId}`,
        CHECKIN_TOOLS,
        dispatchTool,
        1024,
        3,
      )
    : await generate(CHECKIN_SYSTEM, checkinPrompt(input), 1024)

  return parseJsonResponse<PlanCheckin>(response, 'check-in')
}
