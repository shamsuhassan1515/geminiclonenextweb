import axios from 'axios'

// Use empty string for relative path (vite proxy will handle it)
const API_BASE = ''

export interface DeerflowResearchRequest {
  plan: string
  deerflowUrl?: string
}

export interface DeerflowEvent {
  type: string
  content?: string
  query?: string
  results?: any
  progress?: number
  step?: number
  message?: string
  error?: string
}

/**
 * Execute DeerFlow deep research with streaming response
 */
export async function* startDeerflowResearch(
  request: DeerflowResearchRequest
): AsyncGenerator<DeerflowEvent> {
  const token = localStorage.getItem('token')
  const apiKey = localStorage.getItem('apiKey')

  const response = await fetch(`${API_BASE}/api/deerflow-research`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || apiKey}`
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data) {
          try {
            const event = JSON.parse(data) as DeerflowEvent
            yield event
          } catch (e) {
            console.warn('[DeerflowAPI] Failed to parse event:', data)
          }
        }
      }
    }
  }
}

/**
 * Get DeerFlow run status
 */
export async function getDeerflowStatus(threadId: string, runId: string) {
  const token = localStorage.getItem('token')
  const apiKey = localStorage.getItem('apiKey')

  const response = await axios.get(
    `${API_BASE}/api/deerflow-status/${threadId}/${runId}`,
    {
      headers: {
        'Authorization': `Bearer ${token || apiKey}`
      }
    }
  )

  return response.data
}

/**
 * Cancel DeerFlow run
 */
export async function cancelDeerflowRun(threadId: string, runId: string) {
  const token = localStorage.getItem('token')
  const apiKey = localStorage.getItem('apiKey')

  const response = await axios.post(
    `${API_BASE}/api/deerflow-cancel/${threadId}/${runId}`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token || apiKey}`
      }
    }
  )

  return response.data
}

/**
 * Generate research plan using Gemini
 */
export async function generateResearchPlan(
  message: string,
  geminiApiKey: string,
  geminiApiUrl: string,
  model?: string
): Promise<string> {
  const token = localStorage.getItem('token')
  const apiKey = localStorage.getItem('apiKey')

  const response = await fetch(`${API_BASE}/api/generate-research-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || apiKey}`
    },
    body: JSON.stringify({
      message,
      geminiApiKey,
      geminiApiUrl,
      model: model || 'gemini-2.5-pro-preview-06-17'
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  let plan = ''
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data) {
          try {
            const event = JSON.parse(data)
            if (event.type === 'plan_delta' && event.content) {
              plan += event.content
            } else if (event.type === 'plan_done' && event.plan) {
              plan = event.plan
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  return plan
}
