import * as dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth, authV2, mlog, regCookie, turnstileCheck, verify } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { isNotEmptyString,formattedDate } from './utils/is'
import multer from "multer"
import path from "path"
import fs from "fs"
import pkg from '../package.json'
// const { createProxyMiddleware } = require('http-proxy-middleware');
//import {createProxyMiddleware} from "http-proxy-middleware"
import  proxy from "express-http-proxy"
import bodyParser  from 'body-parser';
import FormData  from 'form-data'
import axios from 'axios';
import AWS  from 'aws-sdk';
import { v4 as uuidv4} from 'uuid';
import { viggleProxyFileDo,viggleProxy, lumaProxy, runwayProxy, ideoProxy, ideoProxyFileDo, klingProxy, pikaProxy, udioProxy, runwaymlProxy, pixverseProxy, sunoProxy, GptImageEdit } from './myfun'
// import { runDeepResearch, type DeepResearchConfig } from './deepresearch/dr_loop'
// import type { SearchProviderType } from './deepresearch/types'
// import { DeerflowClient, transformDeerflowEvent } from './deerflow/client'
const app = express()
const router = express.Router()

// NewAPI 路由
import { signJWT, verifyJWT } from './utils/jwt'

const NEWAPI_BASE = process.env.NEWAPI_BASE || 'http://127.0.0.1:3001'

// 存储 session 的 Map (userId -> session cookie)
const sessionStore = new Map<number, string>()

// 登录
router.post('/newapi/login', async (req, res) => {
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
    console.error(`[NewAPI] Login error for user ${req.body.username}:`, error.message)
    if (error.response) {
      console.error(`[NewAPI] Error response data:`, error.response.data)
      res.json(error.response.data)
    } else if (error.request) {
      console.error(`[NewAPI] No response received from ${NEWAPI_BASE}`)
      res.json({
        success: false,
        message: `无法连接到 NewAPI 服务 (${NEWAPI_BASE})，请检查后端状态`
      })
    } else {
      res.json({
        success: false,
        message: `登录请求异常: ${error.message}`
      })
    }
  }
})

// 获取当前用户信息
router.get('/newapi/me', async (req, res) => {
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
router.get('/newapi/token', async (req, res) => {
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
        'Content-Type': 'application/json',
        'New-Api-User': String(payload.userId)
      }
    })

    if (response.data.success) {
      res.json({
        success: true,
        tokens: response.data.data?.items || []
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
router.get('/newapi/api-key', async (req, res) => {
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
        'Content-Type': 'application/json',
        'New-Api-User': String(payload.userId)
      }
    })

    const items = response.data.data?.items || [];
    if (response.data.success && items.length > 0) {
      // 获取第一个可用的 Token
      const firstToken = items[0]

      // 获取 Token 的 Key
      const keyResponse = await axios.post(`${NEWAPI_BASE}/api/token/${firstToken.id}/key`, {}, {
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json',
          'New-Api-User': String(payload.userId)
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
router.post('/newapi/logout', (req, res) => {
  res.json({ success: true })
})

// Gemini API 代理 - 使用用户 Token Key 调用 NewAPI 标准接口
router.post('/newapi/gemini', async (req, res) => {
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
    // 先获取用户的第一个可用 Token Key
    const tokenListResp = await axios.get(`${NEWAPI_BASE}/api/token`, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json',
        'New-Api-User': String(payload.userId)
      }
    })

    const items = tokenListResp.data.data?.items || [];
    if (!tokenListResp.data.success || items.length === 0) {
      res.json({ success: false, message: '没有可用的 API Token，请在 NewAPI 中创建一个 Token' })
      return
    }

    // 取第一个 Token 的详情以获得 Key
    const firstToken = items[0]
    const keyResp = await axios.post(`${NEWAPI_BASE}/api/token/${firstToken.id}/key`, {}, {
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json',
        'New-Api-User': String(payload.userId)
      }
    })

    if (!keyResp.data.success) {
      res.json({ success: false, message: '获取 API Key 失败' })
      return
    }

    const apiKey = keyResp.data.data.key

    // 用 API Key 调用 NewAPI 的标准 OpenAI 兼容接口
    const response = await axios.post(`${NEWAPI_BASE}/v1/chat/completions`, req.body, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    res.json(response.data)
  } catch (error: any) {
    console.error('[NewAPI] Gemini proxy error:', error.message)
    if (error.response) {
      res.json(error.response.data)
    } else {
      res.json({
        success: false,
        message: error.message || '调用 API 失败'
      })
    }
  }
})

// API 路由必须在 express.static 之前注册
// bodyParser 必须在路由之前注册，否则 req.body 为 undefined
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('', router)
app.use('/api', router)

app.use(express.static('public' ,{
  // 设置响应头，允许带有查询参数的请求访问静态文件
  setHeaders: (res, path, stat) => {
    res.set('Cache-Control', 'public, max-age=1');
  }
} ))
//app.use(express.json())
// bodyParser 已移至路由前，此处保留空行



app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type, X-Ptoken, X-Vtoken')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }
  next()
})

router.post('/chat-process',authV2 , async (req, res) => { //[authV2, limiter]
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    const { prompt, options = {}, systemMessage, temperature, top_p } = req.body as RequestProps
    let firstChunk = true
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
      temperature,
      top_p,
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.all('/session', async (req, res) => {
  try {
    const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
    const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
    const isUpload= isNotEmptyString(  process.env.API_UPLOADER )
    const isHideServer= isNotEmptyString(  process.env.HIDE_SERVER );
    const amodel=   process.env.OPENAI_API_MODEL?? "gpt-3.5-turbo" ;
    const isApiGallery=  isNotEmptyString(  process.env.MJ_API_GALLERY );
    const cmodels =   process.env.CUSTOM_MODELS??'' ;
    const baiduId=process.env.TJ_BAIDU_ID?? "" ;
    const googleId=process.env.TJ_GOOGLE_ID?? "" ;
    const notify = process.env.SYS_NOTIFY?? "" ;
    const disableGpt4 = process.env.DISABLE_GPT4?? "" ;
    const isUploadR2 = isNotEmptyString(process.env.R2_DOMAIN);
    const isWsrv =  process.env.MJ_IMG_WSRV?? ""
    const uploadImgSize =  process.env.UPLOAD_IMG_SIZE?? "5"
    const gptUrl = process.env.GPT_URL?? "";
    const theme = process.env.SYS_THEME?? "dark";
    const isCloseMdPreview = process.env.CLOSE_MD_PREVIEW?true:false
    const uploadType= process.env.UPLOAD_TYPE
    const turnstile= process.env.TURNSTILE_SITE
    const menuDisable= process.env.MENU_DISABLE??""
    const visionModel= process.env.VISION_MODEL??""
    const systemMessage= process.env.SYSTEM_MESSAGE??""
    const customVisionModel= process.env.CUSTOM_VISION_MODELS??""
    const backgroundImage = process.env.BACKGROUND_IMAGE ?? ""
    let  isHk= (process.env.OPENAI_API_BASE_URL??"").toLocaleLowerCase().indexOf('-hk')>0
    if(!isHk)  isHk= (process.env.LUMA_SERVER??"").toLocaleLowerCase().indexOf('-hk')>0
    if(!isHk)  isHk= (process.env.VIGGLE_SERVER??"").toLocaleLowerCase().indexOf('-hk')>0


    const data= { disableGpt4,isWsrv,uploadImgSize,theme,isCloseMdPreview,uploadType,
      notify , baiduId, googleId,isHideServer,isUpload, auth: hasAuth
      , model: currentModel(),amodel,isApiGallery,cmodels,isUploadR2,gptUrl
      ,turnstile,menuDisable,visionModel,systemMessage,customVisionModel,backgroundImage,isHk
    }
    res.send({  status: 'Success', message: '', data})
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', verify)
router.get('/reg', regCookie )

 const API_BASE_URL = isNotEmptyString(process.env.OPENAI_API_BASE_URL)
    ? process.env.OPENAI_API_BASE_URL
    : 'https://api.openai.com'

app.use('/mjapi',authV2 , proxy(process.env.MJ_SERVER?process.env.MJ_SERVER:'https://api.openai.com', {
  https: false, limit: '10mb',
  proxyReqPathResolver: function (req) {
    return req.originalUrl.replace('/mjapi', '') // 将URL中的 `/mjapi` 替换为空字符串
  },
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    if(  process.env.MJ_API_SECRET ) proxyReqOpts.headers['mj-api-secret'] = process.env.MJ_API_SECRET;
    proxyReqOpts.headers['Content-Type'] = 'application/json';
    proxyReqOpts.headers['Mj-Version'] = pkg.version;
    return proxyReqOpts;
  },
  //limit: '10mb'

}));



// 设置存储引擎和文件保存路径
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadFolderPath=`./uploads/${formattedDate()}/`;//`

    //console.log('dir', __dirname   ) ;

    if(!fs.existsSync('./uploads/')) {
      fs.mkdirSync('./uploads/');
    }
    if(!fs.existsSync(uploadFolderPath)) {
      fs.mkdirSync(uploadFolderPath);
    }
    cb(null, `uploads/${formattedDate()}/`);
  },
  filename: function (req, file, cb) {
    let filename=  Date.now() + path.extname(file.originalname);
    console.log( 'file',  filename );
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

const storage2 = multer.memoryStorage();
const upload2 = multer({ storage: storage2 });

// 处理文件上传的路由
const isUpload= isNotEmptyString(  process.env.API_UPLOADER )
if(isUpload){
  if( process.env.FILE_SERVER){
    app.use('/openapi/v1/upload',
    upload2.single('file'),
      async (req, res, next) => {
        //console.log( "boday",req.body ,  req.body.model );
        if(req.file.buffer) {
          const fileBuffer = req.file.buffer;
          const formData = new FormData();
          formData.append('file',  fileBuffer,  { filename:  req.file.originalname }  );
          //formData.append('model',  req.body.model );
        try{
          let url = process.env.FILE_SERVER ;
          let responseBody = await axios.post( url , formData, {
                  headers: {
                  //Authorization: 'Bearer '+ process.env.OPENAI_API_KEY ,
                  'Content-Type': 'multipart/form-data'
                }
            })   ;

          res.json(responseBody.data );
          }catch(e){
            res.status( 400 ).json( {error: e } );
          }
        }else{
          res.status(400).json({'error':'uploader fail'});
        }
      }
    );
  }
  else{
    app.use('/openapi/v1/upload', authV2, upload.single('file'), (req, res) => {
    //res.send('文件上传成功！');
    res.setHeader('Content-type', 'application/json' );
    if(req.file.filename) res.json({ url:`/uploads/${formattedDate()}/${ req.file.filename  }`,created:Date.now() })
    else res.json({ error:`uploader fail`,created:Date.now() })
  });
  }
}else {
  app.use('/openapi/v1/upload',  (req, res) => {
    //res.send('文件上传成功！');
     res.json({ error:`server is no open uploader `,created:Date.now() })
  });
}
app.use('/uploads' , express.static('uploads'));

// R2Client function
const R2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_KEY_ID;
  const accessKeySecret = process.env.R2_KEY_SECRET;
  const endpoint = new AWS.Endpoint(`https://${accountId}.r2.cloudflarestorage.com`);
  const s3 = new AWS.S3({
    endpoint: endpoint,
    region: 'auto',
    credentials: new AWS.Credentials(accessKeyId, accessKeySecret),
		signatureVersion: 'v4',
  });
  return s3;
};

// cloudflare R2 upload
app.post('/openapi/pre_signed', (req, res) => {
  const bucketName = process.env.R2_BUCKET_NAME;
  const domain = process.env.R2_DOMAIN;
  const s3 = R2Client();
  const fileName = uuidv4();
  const saveFile = `${new Date().toISOString().split('T')[0]}/${fileName}${req.body.file_name}`;

  const params = {
    Bucket: bucketName,
    Key: saveFile,
    ContentType: req.body.ContentType,
    Expires: 60 * 60, // 1 hour
  };

  s3.getSignedUrl('putObject', params, (err, url) => {
    if (err) {
      res.status(500).json({
        status: 'Error',
        message: `Couldn't get presigned URL for PutObject: ${err.message}`
      });
      return;
    }

    res.json({
      status: 'Success',
      message: '',
      data: {
        up: url,
        url: `${domain}/${saveFile}`
      }
    });
  });
});

app.use(
  '/openapi/v1/audio/transcriptions',authV2,
  upload2.single('file'),
  async (req, res, next) => {
    //console.log( "boday",req.body ,  req.body.model );
    if(req.file.buffer) {
      const fileBuffer = req.file.buffer;
      const formData = new FormData();
      formData.append('file',  fileBuffer,  { filename:  req.file.originalname }  );
      formData.append('model',  req.body.model );
     try{
       let url = `${API_BASE_URL}/v1/audio/transcriptions` ;
      let responseBody = await axios.post( url , formData, {
              headers: {
              Authorization: 'Bearer '+ process.env.OPENAI_API_KEY ,
              'Content-Type': 'multipart/form-data',
              'Mj-Version': pkg.version
            }
        })   ;
        // console.log('responseBody', responseBody.data  );
       res.json(responseBody.data );
      }catch(e){
        //console.log('goog',e );
        res.status( 400 ).json( {error: e } );
      }

    }else{
      res.status(400).json({'error':'uploader fail'});
    }
  }
);

//代理图片编辑
app.use('/openapi/v1/images/edits',authV2,upload2.any() , GptImageEdit )

//代理openai 接口
app.use('/openapi' ,authV2, turnstileCheck, proxy(API_BASE_URL, {
  https: false, limit: '10mb',
  proxyReqPathResolver: function (req) {
    return req.originalUrl.replace('/openapi', '') // 将URL中的 `/openapi` 替换为空字符串
  },
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    proxyReqOpts.headers['Authorization'] ='Bearer '+ process.env.OPENAI_API_KEY;
    proxyReqOpts.headers['Content-Type'] = 'application/json';
    proxyReqOpts.headers['Mj-Version'] = pkg.version;
    return proxyReqOpts;
  },
  //limit: '10mb'
}));

//代理sunoApi 接口
app.use('/sunoapi' ,authV2,sunoProxy );
app.use('/suno' ,authV2,sunoProxy );



//代理luma 接口
app.use('/luma' ,authV2, lumaProxy  );
app.use('/pro/luma' ,authV2, lumaProxy );

//代理 viggle 文件
app.use('/viggle/asset',authV2 ,  upload2.single('file'), viggleProxyFileDo );
app.use('/pro/viggle/asset',authV2 ,  upload2.single('file'), viggleProxyFileDo );
//代理 viggle
app.use('/viggle' ,authV2, viggleProxy);
app.use('/pro/viggle' ,authV2, viggleProxy);

app.use('/runwayml' ,authV2, runwaymlProxy  );
app.use('/runway' ,authV2, runwayProxy  );
app.use('/kling' ,authV2, klingProxy  );

app.use('/ideogram/remix' ,authV2,  upload2.single('image_file'), ideoProxyFileDo  );
app.use('/ideogram' ,authV2, ideoProxy  );
app.use('/pika' ,authV2, pikaProxy  );
app.use('/udio' ,authV2, udioProxy  );

app.use('/pixverse' ,authV2, pixverseProxy  );

// WebDAV 代理接口
router.post('/webdav-proxy', authV2, async (req, res) => {
  try {
    const { url, method, username, password, data } = req.body

    if (!url || !method || !username || !password) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const auth = Buffer.from(`${username}:${password}`).toString('base64')
    const headers: any = {
      'Authorization': `Basic ${auth}`,
    }

    if (method === 'PUT') {
      headers['Content-Type'] = 'application/json'
    }

    const axiosConfig: any = {
      method,
      url,
      headers,
      timeout: 30000,
    }

    if (method === 'PUT' && data) {
      axiosConfig.data = data
    }

    const response = await axios(axiosConfig)
    res.json({
      success: true,
      status: response.status,
      data: response.data
    })
  }
  catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      status: error.response?.status
    })
  }
})



// Deep Research 功能暂时禁用
/*
interface DeepResearchRequest {
  message: string
  model: string
  geminiApiKey: string
  geminiApiUrl: string
  providerType: SearchProviderType
  searchApiKey?: string
  searchEngineId?: string
  searchBaseUrl?: string
  useThinking?: boolean
  isOfficial?: boolean
}

router.post('/chat-deep-research', authV2, async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')

  try {
    const body = req.body as DeepResearchRequest

    if (!body.message) {
      res.write(JSON.stringify({ error: 'Message is required' }))
      res.end()
      return
    }

    if (!body.geminiApiKey) {
      res.write(JSON.stringify({ error: 'Gemini API Key is required' }))
      res.end()
      return
    }

    const config: DeepResearchConfig = {
      model: body.model || 'gemini-2.5-pro-preview-06-17',
      geminiApiKey: body.geminiApiKey,
      geminiApiUrl: body.geminiApiUrl || 'https://generativelanguage.googleapis.com/v1beta',
      providerType: body.providerType || 'serper',
      searchConfig: {
        apiKey: body.searchApiKey,
        searchEngineId: body.searchEngineId,
        baseUrl: body.searchBaseUrl
      },
      useThinking: body.useThinking ?? true,
      isOfficial: body.isOfficial ?? (body.geminiApiUrl.includes('generativelanguage.googleapis.com'))
    }

    await runDeepResearch(body.message, config, (event) => {
      res.write(JSON.stringify(event) + '\n')
    })
  }
  catch (error: any) {
    res.write(JSON.stringify({ type: 'error', error: error.message }))
  }
  finally {
    res.end()
  }
})

// DeerFlow Deep Research API
router.post('/deerflow-research', authV2, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const { plan, deerflowUrl } = req.body

    if (!plan) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Research plan is required' })}\n\n`)
      res.end()
      return
    }

    const client = new DeerflowClient({
      baseUrl: deerflowUrl || 'http://localhost:2026'
    })

    // 1. Create thread
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Creating research thread...' })}\n\n`)
    const threadId = await client.createThread()
    console.log('[DeerFlow] Thread created:', threadId)
    res.write(`data: ${JSON.stringify({ type: 'thread_created', threadId })}\n\n`)

    // 2. Create run with formatted research message
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Starting research...' })}\n\n`)

    // Format the research message
    const researchMessage = `Please conduct deep research on the following topic:

${plan}

Instructions:
1. Search for current, factual information
2. Analyze multiple sources
3. Provide a comprehensive, well-structured response
4. Include specific data, facts, and citations where possible`

    const runId = await client.createRun(threadId, researchMessage)
    console.log('[DeerFlow] Run created:', runId)
    res.write(`data: ${JSON.stringify({ type: 'run_created', runId })}\n\n`)

    // 3. Stream results
    let progress = 0
    let stepCount = 0

    for await (const event of client.streamResults(threadId, runId)) {
      const transformed = transformDeerflowEvent(event)

      if (transformed) {
        // Skip raw events
        if (transformed.type === 'raw') {
          continue
        }

        // Update progress based on event type
        switch (transformed.type) {
          case 'think':
            progress = Math.min(progress + 2, 85)
            // Only send meaningful think content
            if (transformed.content && transformed.content.length > 20 &&
                !transformed.content.includes('=== Research Cycle') &&
                !transformed.content.includes('=== Generating Final Report')) {
              res.write(`data: ${JSON.stringify({
                type: 'think',
                content: transformed.content,
                progress,
                step: stepCount
              })}\n\n`)
            }
            break

          case 'search':
            progress = Math.min(progress + 8, 85)
            stepCount++
            res.write(`data: ${JSON.stringify({
              type: 'search',
              query: transformed.query || 'Searching...',
              progress,
              step: stepCount
            })}\n\n`)
            break

          case 'search_result':
            progress = Math.min(progress + 5, 85)
            res.write(`data: ${JSON.stringify({
              type: 'search_result',
              results: transformed.results,
              progress,
              step: stepCount
            })}\n\n`)
            break

          case 'tool_start':
            progress = Math.min(progress + 5, 85)
            stepCount++
            // Convert tool calls to search events
            if (transformed.tool === 'web_search' || transformed.tool === 'web_fetch') {
              const query = transformed.input?.query ||
                           (typeof transformed.input === 'string' ? transformed.input :
                           JSON.stringify(transformed.input || {}).slice(0, 100))
              res.write(`data: ${JSON.stringify({
                type: 'search',
                query,
                progress,
                step: stepCount
              })}\n\n`)
            } else if (transformed.tool !== 'read_file') {
              // Skip read_file tool calls (used for loading skills)
              res.write(`data: ${JSON.stringify({
                type: 'status',
                message: `执行: ${transformed.tool}`,
                progress,
                step: stepCount
              })}\n\n`)
            }
            break

          case 'tool_end':
            progress = Math.min(progress + 3, 85)
            // Show tool results if meaningful
            if (transformed.output && transformed.output.length > 10 &&
                transformed.output !== '[]' && transformed.tool !== 'read_file') {
              res.write(`data: ${JSON.stringify({
                type: 'search_result',
                content: transformed.output,
                progress,
                step: stepCount
              })}\n\n`)
            }
            break

          case 'tool_result':
            progress = Math.min(progress + 3, 85)
            if (transformed.content && transformed.content.length > 10 && transformed.content !== '[]') {
              res.write(`data: ${JSON.stringify({
                type: 'search_result',
                content: transformed.content,
                progress,
                step: stepCount
              })}\n\n`)
            }
            break

          case 'step_end':
            progress = Math.min(progress + 10, 85)
            break

          case 'status':
          case 'error':
            res.write(`data: ${JSON.stringify({
              ...transformed,
              progress,
              step: stepCount
            })}\n\n`)
            break
        }

        // Send progress update
        if (progress > 0) {
          res.write(`data: ${JSON.stringify({ type: 'progress', value: progress })}\n\n`)
        }
      }
    }

    // 4. Complete
    res.write(`data: ${JSON.stringify({ type: 'progress', value: 100 })}\n\n`)
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
  }
  catch (error: any) {
    console.error('[DeerFlow] Error:', error.message)
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
  }
  finally {
    res.end()
  }
})

// Get DeerFlow run status
router.get('/deerflow-status/:threadId/:runId', authV2, async (req, res) => {
  try {
    const { threadId, runId } = req.params
    const client = new DeerflowClient()
    const status = await client.getRunStatus(threadId, runId)
    res.json({ success: true, data: status })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Cancel DeerFlow run
router.post('/deerflow-cancel/:threadId/:runId', authV2, async (req, res) => {
  try {
    const { threadId, runId } = req.params
    const client = new DeerflowClient()
    await client.cancelRun(threadId, runId)
    res.json({ success: true, message: 'Run cancelled' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})
*/

app.set('trust proxy', 1)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
