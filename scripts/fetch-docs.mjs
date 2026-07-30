async function main() {
  const sections = [
    '环境准备', '阅读示例', '实际编写',
    '进阶技巧', 'cursor实用功能', '如何更新模板',
  ]
  
  const https = await import('https')
  const baseEncoded = encodeURIComponent('青空莉/工具经验/实时编写前端界面或脚本')
  
  async function fetch(name, page) {
    const url = `https://stagedog.github.io/${baseEncoded}/${page ? encodeURIComponent(page) + '/index.html' : ''}`
    return new Promise(resolve => {
      https.get(url, res => {
        let d = ''
        res.on('data', c => d += c)
        res.on('end', () => resolve({ name, data: d }))
      }).on('error', e => resolve({ name, error: e.message }))
    })
  }
  
  // index
  const idx = await fetch('首页', '')
  if (!idx.error) {
    const body = idx.data.replace(/[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*/i, '')
    const text = body.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    console.log('=== 首页 ===\n' + text.slice(0, 4000))
  }
  
  for (const s of sections) {
    const r = await fetch(s, s)
    if (r.error) {
      console.log(`\n=== ${s}: ${r.error} ===`)
    } else {
      const body = r.data.replace(/[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*/i, '')
      const text = body.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
      console.log(`\n=== ${s} ===\n` + text.slice(0, 5000))
    }
  }
}

main()
