import express from 'express'
import axios from 'axios'
import { signJWT, verifyJWT } from '../utils/jwt'

const router = express.Router()
const NEWAPI_BASE = process.env.NEWAPI_BASE || 'http://localhost:3001'

// 存储 session 的 Map (userId -> session cookie)
const sessionStore = new Map<number, string>()

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  console.log(`[NewAPI] Attempting login for user: ${username} at ${NEWAPI_BASE}`)

  try {
    const response = await axios.post(`${NEWAPI_BASE}/api/user/login`, {
      username,
      password
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log(`[NewAPI] Login response status: ${response.status}`, response.data)

    if (response.data.success) {
      const user = response.data.data

      // 保存 session cookie
      const cookies = response.headers['set-cookie']
      if (cookies) {
        console.log(`[NewAPI] Received session cookies for user: ${user.username}`)
        sessionStore.set(user.id, cookies.join('; '))
      }

      const token = signJWT({
        userId: user.id,
        username: user.username,
        email: user.email
      })

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      })
    } else {
      console.warn(`[NewAPI] Login failed: ${response.data.message}`)
      res.json(response.data)
    }
  } catch (error: any) {
    console.error(`[NewAPI] Login error:`, error.message)
    if (error.response) {
      console.error(`[NewAPI] Error response data:`, error.response.data)
    }
    res.json({
      success: false,
      message: error.response?.data?.message || '登录失败'
    })
  }
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.json({ success: false, message: '未登录' })
    return
  }

  const token = authHeader.substring(7)
  const payload = verifyJWT(token)

  if (!payload) {
    res.json({ success: false, message: 'Token 无效' })
    return
  }

  res.json({
    success: true,
    user: {
      id: payload.userId,
      username: payload.username,
      email: payload.email
    }
  })
})

// 获取用户的 API Token
router.get('/token', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.json({ success: false, message: '未登录' })
    return
  }

  const token = authHeader.substring(7)
  const payload = verifyJWT(token)

  if (!payload) {
    res.json({ success: false, message: 'Token 无效' })
    return
  }

  // 获取用户的 session cookie
  const sessionCookie = sessionStore.get(payload.userId)
  if (!sessionCookie) {
    res.json({ success: false, message: 'Session 已过期，请重新登录' })
    return
  }

  try {
    // 调用 NewAPI 获取用户的 Token 列表
    const response = await axios.get(`${NEWAPI_BASE}/api/token`, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    })

    if (response.data.success) {
      res.json({
        success: true,
        tokens: response.data.data
      })
    } else {
      res.json(response.data)
    }
  } catch (error: any) {
    res.json({
      success: false,
      message: error.response?.data?.message || '获取 Token 失败'
    })
  }
})

// 获取用户的第一个可用 API Key
router.get('/api-key', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.json({ success: false, message: '未登录' })
    return
  }

  const token = authHeader.substring(7)
  const payload = verifyJWT(token)

  if (!payload) {
    res.json({ success: false, message: 'Token 无效' })
    return
  }

  // 获取用户的 session cookie
  const sessionCookie = sessionStore.get(payload.userId)
  if (!sessionCookie) {
    res.json({ success: false, message: 'Session 已过期，请重新登录' })
    return
  }

  try {
    // 调用 NewAPI 获取用户的 Token 列表
    const response = await axios.get(`${NEWAPI_BASE}/api/token`, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      }
    })

    if (response.data.success && response.data.data && response.data.data.length > 0) {
      // 获取第一个可用的 Token
      const firstToken = response.data.data[0]

      // 获取 Token 的 Key
      const keyResponse = await axios.get(`${NEWAPI_BASE}/api/token/${firstToken.id}`, {
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json'
        }
      })

      if (keyResponse.data.success) {
        res.json({
          success: true,
          apiKey: keyResponse.data.data.key,
          tokenName: firstToken.name
        })
      } else {
        res.json({ success: false, message: '获取 API Key 失败' })
      }
    } else {
      res.json({ success: false, message: '没有可用的 API Token，请在 NewAPI 中创建' })
    }
  } catch (error: any) {
    res.json({
      success: false,
      message: error.response?.data?.message || '获取 API Key 失败'
    })
  }
})

// 登出
router.post('/logout', (req, res) => {
  res.json({ success: true })
})

// Gemini API 代理
router.post('/gemini', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.json({ success: false, message: '未登录' })
    return
  }

  const token = authHeader.substring(7)
  const payload = verifyJWT(token)

  if (!payload) {
    res.json({ success: false, message: 'Token 无效' })
    return
  }

  // 获取用户的 session cookie
  const sessionCookie = sessionStore.get(payload.userId)
  if (!sessionCookie) {
    res.json({ success: false, message: 'Session 已过期，请重新登录' })
    return
  }

  try {
    // 转发请求到 NewAPI 的 Gemini 代理
    const response = await axios.post(`${NEWAPI_BASE}/api/gemini/chat`, req.body, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json',
        'New-Api-User': payload.username
      }
    })

    res.json(response.data)
  } catch (error: any) {
    res.json({
      success: false,
      message: error.response?.data?.message || '调用 Gemini API 失败'
    })
  }
})

export default router
