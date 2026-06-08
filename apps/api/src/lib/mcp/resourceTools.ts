// Resource Discovery MCP Tools
// YouTube Data API v3: 100 units/request; free tier 10,000/day → ~100 plans/day free.
// Only search_youtube_education is implemented for MVP.
// Called once per plan, for the primary topic only.

import type Anthropic from '@anthropic-ai/sdk'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3/search'

// ── YouTube API response types ────────────────────────────────────────────────

interface YouTubeSearchItem {
  id?: { videoId?: string }
  snippet?: { title?: string; description?: string; channelTitle?: string }
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[]
}

// ── Tool definition ───────────────────────────────────────────────────────────

export const RESOURCE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_youtube_education',
    description: 'Searches YouTube for educational videos in Brazilian Portuguese about a topic. Call once per plan for the primary subject topic to populate the tip field with a real URL.',
    input_schema: {
      type: 'object' as const,
      required: ['query'],
      properties: {
        query:       { type: 'string', description: 'Search query in Portuguese (e.g., "Cálculo Integral aula universitária")' },
        max_results: { type: 'integer', minimum: 1, maximum: 3, description: 'Max results to return. Default: 3.' },
      },
    },
  },
]

// ── Tool executor ─────────────────────────────────────────────────────────────

export interface YouTubeResult {
  title:            string
  channel:          string
  url:              string
  duration_hint:    string
}

export async function searchYoutubeEducation(input: { query: string; max_results?: number }): Promise<YouTubeResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []   // graceful degradation: no key → skip silently

  const maxResults = input.max_results ?? 3
  const params = new URLSearchParams({
    part:          'snippet',
    q:             `${input.query} aula universitária português`,
    type:          'video',
    relevanceLanguage: 'pt',
    regionCode:    'BR',
    maxResults:    String(maxResults),
    key:           apiKey,
  })

  const res = await fetch(`${YOUTUBE_API_BASE}?${params}`)
  if (!res.ok) return []

  const data = await res.json() as YouTubeSearchResponse
  return (data.items ?? []).map((item: YouTubeSearchItem) => ({
    title:         item.snippet?.title ?? '',
    channel:       item.snippet?.channelTitle ?? '',
    url:           `https://www.youtube.com/watch?v=${item.id?.videoId}`,
    duration_hint: 'ver no YouTube',
  }))
}

// ── Executor dispatcher ───────────────────────────────────────────────────────

export async function executeResourceTool(name: string, input: unknown): Promise<unknown> {
  switch (name) {
    case 'search_youtube_education': return searchYoutubeEducation(input as { query: string; max_results?: number })
    default: throw new Error(`Unknown resource tool: ${name}`)
  }
}
