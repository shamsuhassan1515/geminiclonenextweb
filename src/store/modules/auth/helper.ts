import { ss } from '@/utils/storage'

const LOCAL_NAME = 'SECRET_TOKEN'

// 新增：自动从 URL 解析设置并保存
function autoSetSettings() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1])
  const settings = urlParams.get('settings')
  if (settings) {
    try {
      const { key, url } = JSON.parse(settings)
      if (key) ss.set('chat-gpt-api-key', key)
      if (url) ss.set('chat-gpt-api-url', url)
    } catch (e) {
      console.error('解析设置失败', e)
    }
  }
}

export function getToken() {
  autoSetSettings() // 每次获取 token 前尝试解析一次
  return ss.get(LOCAL_NAME)
}

export function setToken(token: string) {
  return ss.set(LOCAL_NAME, token)
}

export function removeToken() {
  return ss.remove(LOCAL_NAME)
}
