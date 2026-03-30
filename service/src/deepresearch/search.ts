import axios from 'axios'
import type { SearchResult, SearchProviderType } from './types'

export interface SearchConfig {
  apiKey?: string
  searchEngineId?: string
  baseUrl?: string
}

export async function performSearch(
  query: string,
  providerType: SearchProviderType,
  config: SearchConfig
): Promise<SearchResult[]> {
  console.log('[performSearch] query:', query)
  console.log('[performSearch] providerType:', providerType)
  console.log('[performSearch] config:', JSON.stringify(config))
  
  switch (providerType) {
    case 'serper':
      return serperSearch(query, config.apiKey || '')
    case 'exa':
      return exaSearch(query, config.apiKey || '')
    case 'tavily':
      return tavilySearch(query, config.apiKey || '')
    case 'brave':
      return braveSearch(query, config.apiKey || '')
    case 'google_pse':
      return googlePSESearch(query, config.apiKey || '', config.searchEngineId || '')
    case 'searxng':
      return searxngSearch(query, config.baseUrl || '')
    case 'duckduckgo':
      return duckduckgoSearch(query, config.baseUrl || '')
    default:
      return duckduckgoSearch(query, config.baseUrl || '')
  }
}

async function serperSearch(query: string, apiKey: string): Promise<SearchResult[]> {
  if (!apiKey) {
    console.warn('Serper API key not configured')
    return []
  }
  
  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query, num: 10 },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    )
    
    return (response.data.organic || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet
    }))
  } catch (error) {
    console.error('Serper search error:', error)
    return []
  }
}

async function exaSearch(query: string, apiKey: string): Promise<SearchResult[]> {
  if (!apiKey) {
    console.warn('Exa API key not configured')
    return []
  }
  
  try {
    const response = await axios.post(
      'https://api.exa.ai/search',
      { query, numResults: 10 },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    )
    
    return (response.data.results || []).map((item: any) => ({
      title: item.title,
      url: item.url,
      snippet: item.text
    }))
  } catch (error) {
    console.error('Exa search error:', error)
    return []
  }
}

async function tavilySearch(query: string, apiKey: string): Promise<SearchResult[]> {
  if (!apiKey) {
    console.warn('Tavily API key not configured')
    return []
  }
  
  try {
    const response = await axios.get(
      'https://api.tavily.com/search',
      {
        params: { query, api_key: apiKey, max_results: 10 }
      }
    )
    
    return (response.data.results || []).map((item: any) => ({
      title: item.title,
      url: item.url,
      snippet: item.content
    }))
  } catch (error) {
    console.error('Tavily search error:', error)
    return []
  }
}

async function braveSearch(query: string, apiKey: string): Promise<SearchResult[]> {
  console.log('[Brave] Searching with apiKey:', apiKey ? '***' + apiKey.slice(-4) : 'none')
  if (!apiKey) {
    console.warn('Brave API key not configured')
    return []
  }
  
  try {
    const response = await axios.get(
      'https://api.search.brave.com/res/v1/web/search',
      {
        params: { q: query, count: 10 },
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        }
      }
    )
    
    console.log('[Brave] API response status:', response.status)
    console.log('[Brave] API response data keys:', Object.keys(response.data))
    
    const results = response.data.web?.results || response.data.results || []
    console.log('[Brave] Found results:', results.length)
    
    return results.map((item: any) => ({
      title: item.title,
      url: item.url,
      snippet: item.description || item.snippet || ''
    }))
  } catch (error: any) {
    console.error('[Brave] Search error:', error.message, error.response?.status)
    return []
  }
}

async function googlePSESearch(query: string, apiKey: string, searchEngineId: string): Promise<SearchResult[]> {
  if (!apiKey || !searchEngineId) {
    console.warn('Google PSE API key or search engine ID not configured')
    return []
  }
  
  try {
    const response = await axios.get(
      'https://www.googleapis.com/customsearch/v1',
      {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: query,
          num: 10
        }
      }
    )
    
    return (response.data.items || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet
    }))
  } catch (error) {
    console.error('Google PSE search error:', error)
    return []
  }
}

async function searxngSearch(query: string, baseUrl: string): Promise<SearchResult[]> {
  if (!baseUrl) {
    console.warn('SearXNG base URL not configured')
    return []
  }
  
  try {
    const response = await axios.get(`${baseUrl}/search`, {
      params: { q: query, format: 'json', categories: 'general' }
    })
    
    return (response.data.results || []).map((item: any) => ({
      title: item.title,
      url: item.url,
      snippet: item.content
    }))
  } catch (error) {
    console.error('SearXNG search error:', error)
    return []
  }
}

async function duckduckgoSearch(query: string, baseUrl: string): Promise<SearchResult[]> {
  console.log('[DuckDuckGo] Searching for:', query)
  
  try {
    const response = await axios.get('https://lite.duckduckgo.com/lite/', {
      params: { q: query },
      timeout: 10000
    })
    
    const html = response.data
    const results: SearchResult[] = []
    
    const resultRegex = /<a rel="nofollow" class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    
    let match
    const links: {url: string, title: string}[] = []
    while ((match = resultRegex.exec(html)) !== null && links.length < 10) {
      if (match[1] && match[2] && !match[1].includes('duckduckgo.com')) {
        links.push({
          url: match[1],
          title: match[2].replace(/<[^>]*>/g, '').trim()
        })
      }
    }
    
    const snippets: string[] = []
    let snippetMatch
    while ((snippetMatch = snippetRegex.exec(html)) !== null && snippets.length < 10) {
      snippets.push(snippetMatch[1].replace(/<[^>]*>/g, '').trim())
    }
    
    for (let i = 0; i < links.length; i++) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        snippet: snippets[i] || ''
      })
    }
    
    console.log('[DuckDuckGo] Found results:', results.length)
    return results
  } catch (error: any) {
    console.error('[DuckDuckGo] Search error:', error.message)
    return []
  }
}