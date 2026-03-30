import axios from 'axios'
import { performSearch, type SearchConfig } from './search'
import type { SearchProviderType, SearchResult, DeepResearchMessage } from './types'

const MAX_CYCLES = 8
const MAX_REPORT_TOKENS = 20000

export interface DeepResearchConfig {
  model: string
  geminiApiKey: string
  geminiApiUrl: string
  providerType: SearchProviderType
  searchConfig: SearchConfig
  useThinking: boolean
  isOfficial: boolean
}

interface ConversationMessage {
  role: 'user' | 'model'
  content: string
}

export async function runDeepResearch(
  message: string,
  config: DeepResearchConfig,
  onEvent: (event: DeepResearchMessage) => void
): Promise<string> {
  const messages: ConversationMessage[] = []
  
  onEvent({ type: 'plan_start', plan: 'Analyzing your research query...\n' })
  
  const systemPrompt = getSystemPrompt()
  
  message = `${message}\n\nConduct deep research on the above topic. Break it down into key aspects, search for information on each aspect, analyze and synthesize the findings, and provide a comprehensive, well-structured response.`
  
  messages.push({ role: 'user', content: message })
  
  const plan = await generateResearchPlan(message, systemPrompt, config, onEvent)
  
  if (plan) {
    onEvent({ type: 'plan_delta', content: `\n\nResearch Plan:\n${plan}\n\nNow executing research cycles...\n` })
  }
  
  let cycle = 0
  let researchFindings: string[] = []
  let currentPlan = plan
  
  while (cycle < MAX_CYCLES) {
    cycle++
    onEvent({ type: 'think', content: `\n=== Research Cycle ${cycle}/${MAX_CYCLES} ===\n` })
    
    const cycleResult = await runResearchCycle(
      message,
      currentPlan || '',
      researchFindings,
      messages,
      systemPrompt,
      config,
      onEvent
    )
    
    if (cycleResult.finalReport) {
      onEvent({ type: 'report_start' })
      onEvent({ type: 'report_delta', content: cycleResult.finalReport })
      onEvent({ type: 'done' })
      return cycleResult.finalReport
    }
    
    if (cycleResult.findings) {
      researchFindings.push(...cycleResult.findings)
    }
    
    if (cycleResult.updatedPlan) {
      currentPlan = cycleResult.updatedPlan
    }
  }
  
  onEvent({ type: 'think', content: '\n=== Max cycles reached, generating final report ===\n' })
  const finalReport = await generateFinalReport(message, researchFindings, config, onEvent)
  
  onEvent({ type: 'report_start' })
  onEvent({ type: 'report_delta', content: finalReport })
  onEvent({ type: 'done' })
  
  return finalReport
}

function getSystemPrompt(): string {
  return `You are a highly capable, thoughtful, and precise research agent that conducts deep research on a specific topic. 

Your task is to:
1. Break down the research topic into key aspects to investigate
2. Use the search tool to find information on each aspect
3. Use the think tool to analyze and synthesize your findings
4. Provide a comprehensive, well-structured final report

Guidelines:
- Be thorough and comprehensive in your research
- Cite sources when possible
- Provide detailed, factual information
- Be curious and analytical`
}

async function generateResearchPlan(
  message: string,
  systemPrompt: string,
  config: DeepResearchConfig,
  onEvent: (event: DeepResearchMessage) => void
): Promise<string> {
  const prompt = `${systemPrompt}

The user wants to research: "${message}"

First, create a research plan that breaks down this topic into key aspects to investigate. 

Respond with a research plan in the following format:
## Research Plan
1. [Aspect 1]
2. [Aspect 2]
3. [Aspect 3]
...

Be specific and thorough.`
  
  try {
    const response = await callGemini(prompt, [], config)
    return response
  } catch (error: any) {
    console.error('Error generating research plan:', error)
    onEvent({ type: 'error', error: error.message })
    return ''
  }
}

async function runResearchCycle(
  originalMessage: string,
  plan: string,
  previousFindings: string[],
  messages: ConversationMessage[],
  systemPrompt: string,
  config: DeepResearchConfig,
  onEvent: (event: DeepResearchMessage) => void
): Promise<{
  findings?: string[]
  updatedPlan?: string
  finalReport?: string
}> {
  const researchPrompt = `${systemPrompt}

Current Research Plan:
${plan}

Previous Findings:
${previousFindings.join('\n\n')}

The user wants to research: "${originalMessage}"

Your task:
1. Identify the next key aspect to research from the plan
2. Use the search tool to find information on that aspect
3. Use the think tool to analyze the findings
4. Update the research plan if needed

Search for information on next aspects of the topic. Then use think tool to analyze.`

  const searchQuery = await generateNextSearchQuery(researchPrompt, previousFindings, config, onEvent)
  
  if (!searchQuery) {
    const finalReport = await generateFinalReport(originalMessage, previousFindings, config, onEvent)
    return { finalReport }
  }
  
  onEvent({ type: 'search', query: searchQuery })
  console.log('[DeepResearch] Performing search:', searchQuery, 'provider:', config.providerType)
  const searchResults = await performSearch(searchQuery, config.providerType, config.searchConfig)
  console.log('[DeepResearch] Search results count:', searchResults.length)
  
  onEvent({ 
    type: 'search', 
    query: searchQuery,
    results: searchResults 
  })
  
  if (searchResults.length === 0) {
    onEvent({ type: 'think', content: 'No search results found. Trying alternative queries...\n' })
  }
  
  const findingsText = searchResults.map(r => `${r.title}\n${r.url}\n${r.snippet}`).join('\n\n')
  
  const thinkPrompt = `${systemPrompt}

Search Results for "${searchQuery}":
${findingsText}

Previous Findings:
${previousFindings.join('\n\n')}

Analyze these search results and provide insights for the research. What have you learned? What should be explored next?`

  const thinkResult = await callThink(thinkPrompt, config, onEvent)
  
  const updatedPlan = await updateResearchPlan(thinkResult, plan, config, onEvent)
  
  const shouldGenerateReport = await shouldGenerateFinalReport(thinkResult, config, onEvent)
  
  if (shouldGenerateReport) {
    const finalReport = await generateFinalReport(originalMessage, [...previousFindings, findingsText], config, onEvent)
    return { finalReport }
  }
  
  return {
    findings: [findingsText],
    updatedPlan
  }
}

async function generateNextSearchQuery(
  context: string,
  previousFindings: string[],
  config: DeepResearchConfig,
  onEvent: (event: DeepResearchMessage) => void
): Promise<string | null> {
  const prompt = `${context}

Based on the research so far and the plan, what is the next search query you would like to execute? 

Provide ONLY the search query (no explanation). If you believe enough research has been done, respond with "GENERATE_REPORT".`

  try {
    const response = await callGemini(prompt, [], config)
    
    if (response.includes('GENERATE_REPORT')) {
      return null
    }
    
    return response.trim()
  } catch (error) {
    console.error('Error generating next search query:', error)
    return null
  }
}

async function callThink(
  prompt: string,
  config: DeepResearchConfig,
  onEvent: (event: DeepResearchMessage) => void
): Promise<string> {
  onEvent({ type: 'think', content: '\n[Thinking...]\n' })
  
  const messages = [{ role: 'user' as const, content: prompt }]
  
  try {
    const response = await callGemini(prompt, messages, config)
    onEvent({ type: 'think', content: `\n[Thought]: ${response}\n` })
    return response
  } catch (error: any) {
    console.error('Error in think:', error)
    onEvent({ type: 'error', error: error.message })
    return ''
  }
}

async function updateResearchPlan(
  thinkResult: string,
  currentPlan: string,
  config: DeepResearchConfig,
  onEvent: (event: DeepResearchMessage) => void
): Promise<string> {
  const prompt = `Current Research Plan:
${currentPlan}

Latest Research Analysis:
${thinkResult}

Should the research plan be updated? If yes, provide the updated plan. If no, respond with "NO_CHANGE".`

  try {
    const response = await callGemini(prompt, [], config)
    
    if (response.includes('NO_CHANGE')) {
      return currentPlan
    }
    
    return response
  } catch (error) {
    return currentPlan
  }
}

async function shouldGenerateFinalReport(
  thinkResult: string,
  config: DeepResearchConfig,
  onEvent: (event: DeepResearchMessage) => void
): Promise<boolean> {
  const prompt = `${thinkResult}

Based on this analysis, do you have enough information to generate a comprehensive final research report? 

Respond with "YES_REPORT" if you have enough information, or "NO_MORE_RESEARCH" if you need to continue researching.`

  try {
    const response = await callGemini(prompt, [], config)
    return response.includes('YES_REPORT')
  } catch (error) {
    return false
  }
}

async function generateFinalReport(
  originalMessage: string,
  findings: string[],
  config: DeepResearchConfig,
  onEvent: (event: DeepResearchMessage) => void
): Promise<string> {
  onEvent({ type: 'think', content: '\n=== Generating Final Report ===\n' })
  
  const prompt = `You are a research expert. Based on the user's research request and the findings below, generate a comprehensive, well-structured research report.

User's Research Request:
"${originalMessage}"

Findings:
${findings.join('\n\n')}

Requirements:
- Provide a detailed, well-structured response
- Break down the report into clear sections
- Cite sources when possible
- Be thorough and comprehensive
- Synthesize all findings into a coherent report

Generate the final research report:`

  try {
    const response = await callGemini(prompt, [], config)
    return response
  } catch (error: any) {
    console.error('Error generating final report:', error)
    onEvent({ type: 'error', error: error.message })
    return `Error generating report: ${error.message}`
  }
}

async function callGemini(
  prompt: string,
  messages: ConversationMessage[],
  config: DeepResearchConfig
): Promise<string> {
  const allMessages = [...messages, { role: 'user', content: prompt }]
  
  if (config.isOfficial) {
    return callGeminiOfficial(prompt, messages, config)
  } else {
    return callGeminiProxy(prompt, messages, config)
  }
}

async function callGeminiOfficial(
  prompt: string,
  messages: ConversationMessage[],
  config: DeepResearchConfig
): Promise<string> {
  const allMessages = [...messages, { role: 'user', content: prompt }]
  
  const requestBody: any = {
    contents: allMessages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  }
  
  if (config.useThinking) {
    requestBody.generationConfig.thinkingConfig = {
      thinkingBudget: 1024
    }
  }
  
  const url = `${config.geminiApiUrl}/models/${config.model}:generateContent?key=${config.geminiApiKey}`
  console.log('[DeepResearch] Calling Gemini Official:', url.replace(config.geminiApiKey, '***'))
  
  try {
    const response = await axios.post(url, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0]
      if (candidate.content && candidate.content.parts) {
        return candidate.content.parts.map((p: any) => p.text).join('')
      }
    }
    
    return ''
  } catch (error: any) {
    console.error('[DeepResearch] Gemini Official API error:', error.response?.data || error.message)
    return ''
  }
}

async function callGeminiProxy(
  prompt: string,
  messages: ConversationMessage[],
  config: DeepResearchConfig
): Promise<string> {
  const allMessages = [...messages, { role: 'user', content: prompt }]
  
  const requestBody: any = {
    model: config.model,
    messages: allMessages,
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 8192,
  }
  
  const url = `${config.geminiApiUrl}/v1/chat/completions`
  console.log('[DeepResearch] Calling Gemini Proxy URL:', url)
  console.log('[DeepResearch] Request body:', JSON.stringify(requestBody).substring(0, 200))
  
  try {
    const response = await axios.post(url, requestBody, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.geminiApiKey}`
      },
      timeout: 30000
    })
    console.log('[DeepResearch] Proxy response status:', response.status)
    
    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message?.content || ''
    }
    
    return ''
  } catch (error: any) {
    console.error('[DeepResearch] Gemini Proxy API error:', error.message)
    if (error.code === 'ECONNREFUSED') {
      console.error('[DeepResearch] Connection refused - check if proxy is running on', config.geminiApiUrl)
    }
    if (error.response) {
      console.error('[DeepResearch] Response status:', error.response.status)
      console.error('[DeepResearch] Response data:', error.response.data)
    }
    return ''
  }
}