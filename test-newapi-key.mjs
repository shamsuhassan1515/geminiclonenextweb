const API_KEY = 'sk-cFcQJ9wJ2xSgGjFhAcJJg22IGPk03kRvcoQPZX7OzDNmyJpd';
const API_URL = 'http://127.0.0.1:8045/v1/chat/completions';

async function testGoogleSearch() {
  console.log('测试 NewAPI key 是否支持 Google Search...\n');
  
  const requestBody = {
    model: 'gemini-3-flash',
    messages: [
      {
        role: 'user',
        content: '今天是 2026 年 3 月 23 日，请告诉我今天最新的新闻有哪些？'
      }
    ],
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 8192,
    tools: [
      {
        type: 'function',
        function: {
          name: 'googleSearch'
        }
      }
    ]
  };

  console.log('正在发送请求...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('响应状态码:', response.status);
    
    const responseText = await response.text();
    
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.error('请求失败：');
        console.error(JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('请求失败，响应不是JSON：', responseText);
      }
      return;
    }

    try {
      const data = JSON.parse(responseText);
      console.log('响应数据：');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n');
      
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0];
        console.log('完成原因:', choice.finish_reason);
        
        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
          console.log('\n✅ Google Search 工具被调用！');
          console.log('工具调用详情:');
          choice.message.tool_calls.forEach((tool, index) => {
            console.log(`  ${index + 1}. ${tool.function.name}`);
            console.log(`     参数: ${tool.function.arguments}`);
          });
          
          if (choice.finish_reason === 'tool_calls') {
            console.log('\n模型希望调用工具，需要发送工具调用结果才能继续。');
          }
        } else {
          const content = choice.message?.content || '';
          console.log('回复内容：');
          console.log(content);
          
          if (content.includes('2026') || content.includes('今天') || content.includes('最新')) {
            console.log('\n✅ Google Search 已启用！获取到了最新信息！');
          } else {
            console.log('\n❌ Google Search 可能未启用，返回的是旧信息。');
          }
        }
      }
    } catch (e) {
      console.error('解析响应失败：', e);
    }
  } catch (error) {
    console.error('发生错误：', error);
  }
}

testGoogleSearch();
