import { generate, parseJsonResponse } from '../lib/anthropic'
import {
  DIAGNOSE_STUDENT_SYSTEM,
  diagnoseStudentPrompt,
  type DiagnoseStudentInput,
} from '../lib/prompts'
import type { DiagnosticResult } from '@funcionaria/types'

export const runDiagnosis = async (input: DiagnoseStudentInput): Promise<DiagnosticResult> => {
  const response = await generate(DIAGNOSE_STUDENT_SYSTEM, diagnoseStudentPrompt(input), 512)
  return parseJsonResponse<DiagnosticResult>(response, 'diagnóstico')
}
