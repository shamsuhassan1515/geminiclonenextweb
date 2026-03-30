export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export type SearchProviderType = 
  | 'google_pse'
  | 'serper'
  | 'exa'
  | 'searxng'
  | 'brave'
  | 'duckduckgo'
  | 'tavily'

export interface SearchProviderConfig {
  apiKey?: string
  config: Record<string, string>
}

export interface SearchRequest {
  query: string
  providerType: SearchProviderType
  config: SearchProviderConfig
}

export interface DeepResearchMessage {
  type: 'search' | 'think' | 'plan_start' | 'plan_delta' | 'report_start' | 'report_delta' | 'done' | 'error'
  query?: string
  results?: SearchResult[]
  content?: string
  plan?: string
  error?: string
}