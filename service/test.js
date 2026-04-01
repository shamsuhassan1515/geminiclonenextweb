const express = require('express')
const app = express()
const router = express.Router()

// 测试路由
router.post('/newapi/gemini', (req, res) => {
  res.json({ success: true, message: '测试成功' })
})

app.use('', router)
app.use('/api', router)

app.listen(3003, () => console.log('Test server running on port 3003'))