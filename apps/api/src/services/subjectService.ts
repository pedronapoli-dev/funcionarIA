import pdfParse from 'pdf-parse'
import { generate, parseJsonResponse } from '../lib/anthropic'
import { supabase } from '../lib/supabase'
import { PARSE_SUBJECT_SYSTEM, parseSubjectPrompt } from '../lib/prompts'
import type { ParsedSubject } from '@funcionaria/types'

export const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
  const data = await pdfParse(buffer)
  return data.text.trim()
}

export const parseSubjectFromText = async (rawText: string): Promise<ParsedSubject> => {
  const response = await generate(PARSE_SUBJECT_SYSTEM, parseSubjectPrompt(rawText), 4096)
  console.info('[parseSubject] raw response:', response.slice(0, 500))
  const parsed = parseJsonResponse<ParsedSubject>(response, 'ementa')
  parsed.topics        = parsed.topics        ?? []
  parsed.bibliography  = parsed.bibliography  ?? []
  parsed.prerequisites = parsed.prerequisites ?? []
  return parsed
}

export const saveSubject = async (
  userId: string,
  parsed: ParsedSubject,
  rawText: string,
  sourceType: 'pdf' | 'text' | 'manual' = 'pdf'
) => {
  const { data, error } = await supabase
    .from('subjects')
    .insert({
      user_id: userId,
      name: parsed.name,
      code: parsed.code ?? null,
      course: parsed.course ?? null,
      university: parsed.university ?? null,
      credits: parsed.credits ?? null,
      workload_hours: parsed.workload_hours ?? null,
      description: parsed.description ?? '',
      topics: parsed.topics ?? [],
      bibliography: parsed.bibliography ?? [],
      prerequisites: parsed.prerequisites ?? [],
      raw_text: rawText,
      source_type: sourceType,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
