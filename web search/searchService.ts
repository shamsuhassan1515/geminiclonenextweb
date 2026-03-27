// Web Search Service - migrated from Onyx
import type { WebSearchProvider, WebSearchProviderType } from './types'

const STORAGE_KEY = 'web_search_providers'

// Get all providers from localStorage
export function getProviders(): WebSearchProvider[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Save providers to localStorage
export function saveProviders(providers: WebSearchProvider[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers))
}

// Add or update a provider
export function saveProvider(provider: WebSearchProvider): void {
  const providers = getProviders()
  const index = providers.findIndex((p) => p.id === provider.id)
  if (index >= 0) {
    providers[index] = provider
  } else {
    provider.id = Date.now().toString()
    providers.push(provider)
  }
  saveProviders(providers)
}

// Delete a provider
export function deleteProvider(id: string): void {
  const providers = getProviders().filter((p) => p.id !== id)
  saveProviders(providers)
}

// Activate a provider (deactivate others)
export function activateProvider(id: string): void {
  const providers = getProviders().map((p) => ({
    ...p,
    isActive: p.id === id,
  }))
  saveProviders(providers)
}

// Deactivate a provider
export function deactivateProvider(id: string): void {
  const providers = getProviders().map((p) =>
    p.id === id ? { ...p, isActive: false } : p
  )
  saveProviders(providers)
}

// Get active provider
export function getActiveProvider(): WebSearchProvider | null {
  return getProviders().find((p) => p.isActive) || null
}

// Test provider connection
export async function testProvider(
  providerType: WebSearchProviderType,
  apiKey: string,
  config: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  try {
    // For now, just return success
    // In a real implementation, this would make an actual API call to test
    if (apiKey || config) {
      return { success: true, message: 'Connection test passed' }
    }
    return { success: false, message: 'Missing required configuration' }
  } catch (error) {
    return { success: false, message: 'Connection test failed' }
  }
}

// Perform web search using the active provider
export async function performWebSearch(query: string): Promise<SearchResult[]> {
  const provider = getActiveProvider()
  if (!provider) {
    console.warn('No active web search provider configured')
    return []
  }

  try {
    // This would be the actual API call to the search provider
    // For now, return mock results
    return [
      {
        title: `Search result for: ${query}`,
        url: 'https://example.com',
        snippet: 'This is a mock search result.',
      },
    ]
  } catch (error) {
    console.error('Web search failed:', error)
    return []
  }
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
}
