// MCP Tool Registry
// Maps tool names to executor functions.
// All tool calls in generateWithTools() go through here.

import { executeSupabaseTool } from './supabaseTools'
import { executeSpacedRepTool } from './spacedRepTools'
import { executeResourceTool }  from './resourceTools'

type ToolExecutor = (name: string, input: unknown) => Promise<unknown>

const SYNC_TO_ASYNC = (fn: (name: string, input: unknown) => unknown): ToolExecutor =>
  async (name, input) => fn(name, input)

// Maps each tool name to the executor that handles it
const TOOL_MAP: Record<string, ToolExecutor> = {
  // Supabase Progress MCP (async — DB queries)
  get_student_progress:      executeSupabaseTool,
  get_spaced_review_status:  executeSupabaseTool,
  get_plan_context:          executeSupabaseTool,
  // SM-2 Algorithm (sync — pure computation wrapped as async)
  calculate_review_schedule: SYNC_TO_ASYNC(executeSpacedRepTool),
  get_next_reviews_due:      SYNC_TO_ASYNC(executeSpacedRepTool),
  // Resource Discovery (async — YouTube API)
  search_youtube_education:  executeResourceTool,
}

// Main dispatcher — used as the toolExecutor argument in generateWithTools()
export const dispatchTool = async (name: string, input: unknown): Promise<unknown> => {
  const executor = TOOL_MAP[name]
  if (!executor) throw new Error(`MCP tool not registered: ${name}`)
  return executor(name, input)
}
