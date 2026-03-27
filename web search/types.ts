// Web Search Provider Types - migrated from Onyx
export type WebSearchProviderType =
  | 'google_pse'
  | 'serper'
  | 'exa'
  | 'searxng'
  | 'brave'
  | 'duckduckgo'
  | 'tavily'

export interface WebSearchProvider {
  id: string
  name: string
  providerType: WebSearchProviderType
  apiKey?: string
  config: Record<string, string>
  isActive: boolean
}

export interface WebSearchProviderDetail {
  label: string
  subtitle: string
  helper: string
  requiresApiKey: boolean
  requiredConfigKeys: string[]
  apiKeyUrl?: string
}

export const SEARCH_PROVIDER_DETAILS: Record<WebSearchProviderType, WebSearchProviderDetail> = {
  exa: {
    label: 'Exa',
    subtitle: 'Exa.ai',
    helper: 'Connect to Exa to set up web search.',
    requiresApiKey: true,
    requiredConfigKeys: [],
    apiKeyUrl: 'https://dashboard.exa.ai/api-keys',
  },
  serper: {
    label: 'Serper',
    subtitle: 'Serper.dev',
    helper: 'Connect to Serper to set up web search.',
    requiresApiKey: true,
    requiredConfigKeys: [],
    apiKeyUrl: 'https://serper.dev/api-key',
  },
  brave: {
    label: 'Brave',
    subtitle: 'Brave Search API',
    helper: 'Connect to Brave Search API to set up web search.',
    requiresApiKey: true,
    requiredConfigKeys: [],
    apiKeyUrl: 'https://api-dashboard.search.brave.com/app/documentation/web-search/get-started',
  },
  google_pse: {
    label: 'Google PSE',
    subtitle: 'Google',
    helper: 'Connect to Google PSE to set up web search.',
    requiresApiKey: true,
    requiredConfigKeys: ['search_engine_id'],
    apiKeyUrl: 'https://programmablesearchengine.google.com/controlpanel/all',
  },
  searxng: {
    label: 'SearXNG',
    subtitle: 'SearXNG',
    helper: 'Connect to SearXNG to set up web search.',
    requiresApiKey: false,
    requiredConfigKeys: ['searxng_base_url'],
  },
  duckduckgo: {
    label: 'DuckDuckGo',
    subtitle: 'DuckDuckGo API',
    helper: 'Connect to DuckDuckGo API to set up web search.',
    requiresApiKey: false,
    requiredConfigKeys: ['api_base_url'],
  },
  tavily: {
    label: 'Tavily',
    subtitle: 'Tavily Search API',
    helper: 'Connect to Tavily Search API to set up web search.',
    requiresApiKey: true,
    requiredConfigKeys: [],
    apiKeyUrl: 'https://app.tavily.com/home',
  },
}

export type WebSearchProviderOrder = WebSearchProviderType[]

export const SEARCH_PROVIDER_ORDER: WebSearchProviderOrder = [
  'google_pse',
  'serper',
  'exa',
  'searxng',
  'brave',
  'duckduckgo',
  'tavily',
]
