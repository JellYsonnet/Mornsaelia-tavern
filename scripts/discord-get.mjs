/**
 * Discord 帖子导出工具
 * 用法: node scripts/discord-get.mjs <token> [thread_channel_id]
 * 
 * 默认导出: 1502284115729191033 (艾瑟洛斯卡帖子)
 */

const TOKEN = process.argv[2]
const CHANNEL_ID = process.argv[3] || '1502284115729191033'

if (!TOKEN) {
  console.log('用法: node scripts/discord-get.mjs <DiscordToken> [channel_id]')
  console.log('')
  console.log('获取你的 Discord Token:')
  console.log('1. 浏览器打开 discord.com 并登录')
  console.log('2. 按 F12 打开开发者工具')
  console.log('3. Console 里输入: copy(document.cookie.match(/token=([^;]+)/)?.[1] || "not found")')
  console.log('4. 或者: Application → Local Storage → https://discord.com → token')
  process.exit(1)
}

const https = await import('https')

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': TOKEN,
        'User-Agent': 'Mozilla/5.0',
      }
    }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0, 200)}`))
        } else {
          resolve(JSON.parse(d))
        }
      })
    }).on('error', reject)
  })
}

// 检查帖子是否有效，拉取消息
async function main() {
  console.log(`正在获取帖子 ${CHANNEL_ID}...`)
  
  // 先尝试获取频道/帖子信息
  try {
    const channel = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}`)
    console.log(`频道/帖子: ${channel.name || '(无名称)'} (type: ${channel.type})`)
  } catch (e) {
    console.log(`无法获取频道信息:`, e.message)
    console.log('这可能是子帖子，尝试继续拉消息...')
  }
  
  // 拉消息 (最多 100 条)
  const messages = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=100`)
  console.log(`\n获取到 ${messages.length} 条消息\n`)
  
  // 输出所有消息内容
  for (const msg of messages) {
    const author = msg.author?.username || 'unknown'
    const content = msg.content || ''
    const attachments = msg.attachments?.map(a => a.url).join(', ') || ''
    
    console.log(`--- ${author} (${msg.id}) ---`)
    if (content) console.log(content)
    if (attachments) console.log(`[附件] ${attachments}`)
    console.log('')
  }
  
  // 如果有附件图片，列出所有附件 URL
  const allAttachments = messages.flatMap(m => m.attachments || [])
  if (allAttachments.length > 0) {
    console.log(`\n=== 附件列表 (共 ${allAttachments.length} 个) ===`)
    for (const a of allAttachments) {
      console.log(a.url)
    }
  }
}

main().catch(e => console.error('错误:', e.message))
