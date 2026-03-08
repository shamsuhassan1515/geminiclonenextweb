// 简单的 Mock API 服务器
// 用于处理前端开发时的 API 请求

export default function mockServerPlugin() {
  return {
    name: 'mock-server',
    configureServer(server) {
      server.middlewares.use('/api/session', (req, res, next) => {
        if (req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            status: 'Success',
            message: 'ok',
            data: {
              auth: false,
              model: 'ChatGPTUnofficialProxyAPI',
              allowRegister: true,
            },
          }))
        }
        else {
          next()
        }
      })

      server.middlewares.use('/api/config', (req, res, next) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          status: 'Success',
          message: 'ok',
          data: {
            apiModel: 'ChatGPTUnofficialProxyAPI',
            reverseProxy: '',
            timeoutMs: 100000,
            socksProxy: '',
            httpsProxy: '',
          },
        }))
      })

      server.middlewares.use('/api/chat', (req, res, next) => {
        if (req.method === 'POST') {
          res.setHeader('Content-Type', 'application/octet-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')

          // 模拟流式响应
          const message = 'Hello! I am a mock AI assistant. This is a development environment.'
          const chunks = message.split(' ')

          let index = 0
          const interval = setInterval(() => {
            if (index >= chunks.length) {
              clearInterval(interval)
              res.end('[DONE]')
              return
            }

            const chunk = {
              id: 'chatcmpl-mock',
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: 'gpt-3.5-turbo',
              choices: [{
                index: 0,
                delta: { content: `${chunks[index]} ` },
                finish_reason: null,
              }],
            }

            res.write(`data: ${JSON.stringify(chunk)}\n\n`)
            index++
          }, 100)
        }
        else {
          next()
        }
      })
    },
  }
}
