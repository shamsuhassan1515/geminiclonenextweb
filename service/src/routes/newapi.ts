import express from 'express'
import axios from 'axios'
import { signJWT, verifyJWT } from '../utils/jwt'

const router = express.Router()
const NEWAPI_BASE = process.env.NEWAPI_BASE || 'http://localhost:3001'

// 登录 POST /api/newapi/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    const response = await axios.post(`${NEWAPI_BASE}/api/user/login`, {
      username,
      password
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.success) {
      const user = response.data.data
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
      res.json(response.data)
    }
  } catch (error: any) {
    res.json({
      success: false,
      message: error.response?.data?.message || '登录失败'
    })
  }
})

// 获取当前用户信息 GET /api/newapi/me
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

// 登出 POST /api/newapi/logout
router.post('/logout', (req, res) => {
  res.json({ success: true })
})

export default router
