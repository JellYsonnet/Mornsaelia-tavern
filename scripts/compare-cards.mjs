import fs from 'fs'
import zlib from 'zlib'

// 艾瑟洛斯卡
const buf1 = fs.readFileSync('C:/Users/76401/.openclaw/media/inbound/艾瑟洛斯---97bc8ff4-59a5-47be-a9e7-13a1565901c0.png')
// 莫恩瑟利亚卡
const buf2 = fs.readFileSync('D:/.openclaw/workspace/projects/Mornsaelia-tavern/dist/莫恩瑟利亚/角色卡/莫恩瑟利亚.png')

function extractCard(buf) {
  let off = 8
  while (off < buf.length - 4) {
    const len = buf.readUInt32BE(off), t = buf.slice(off + 4, off + 8).toString()
    if (t === 'tEXt') {
      const n = buf.indexOf(0, off + 8)
      if (n > off + 8) {
        const k = buf.slice(off + 8, n).toString()
        if (k === 'chara') {
          const raw = buf.slice(n + 1, off + 8 + len).toString()
          return JSON.parse(Buffer.from(raw, 'base64').toString())
        }
      }
    }
    if (t === 'IEND') break
    off += 12 + len
  }
  return null
}

const ais = extractCard(buf1) // 艾瑟洛斯
const mns = extractCard(buf2) // 莫恩瑟利亚

if (!ais) { console.log('❌ 艾瑟洛斯卡片读取失败'); process.exit(1) }
if (!mns) { console.log('❌ 莫恩瑟利亚卡片读取失败'); process.exit(1) }

const d1 = ais.data || ais
const d2 = mns.data || mns

console.log('')
console.log('=== 顶层字段对比 ===')
const topFields = ['spec', 'spec_version', 'name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'creatorcomment', 'avatar', 'talkativeness', 'fav', 'tags']
for (const f of topFields) {
  const v1 = JSON.stringify(ais[f] ?? '')
  const v2 = JSON.stringify(mns[f] ?? '')
  const match = v1 === v2 ? '✅' : '❌'
  console.log(`${match} ${f}:`.padEnd(22), '艾:', v1.slice(0, 60), '| 莫:', v2.slice(0, 60))
}

console.log('')
console.log('=== data 字段对比 ===')
const dataFields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'creator_notes', 'character_version', 'system_prompt', 'post_history_instructions', 'tags', 'creator']
for (const f of dataFields) {
  const v1 = JSON.stringify(d1[f] ?? '')
  const v2 = JSON.stringify(d2[f] ?? '')
  const match = v1 === v2 ? '✅' : '❌'
  console.log(`${match} data.${f}:`.padEnd(25), '艾:', v1.slice(0, 60), '| 莫:', v2.slice(0, 60))
}

console.log('')
console.log('=== alternate_greetings ===')
console.log('艾 count:', d1.alternate_greetings?.length || 0)
console.log('莫 count:', d2.alternate_greetings?.length || 0)
if (d1.alternate_greetings?.length) {
  console.log('艾 [0] 开头80字:', JSON.stringify(d1.alternate_greetings[0]).slice(0, 80))
}
if (d2.alternate_greetings?.length) {
  console.log('莫 [0] 开头80字:', JSON.stringify(d2.alternate_greetings[0]).slice(0, 80))
}
// 完整对比
const ag1 = d1.alternate_greetings?.[0] || ''
const ag2 = d2.alternate_greetings?.[0] || ''
console.log('艾 alternate_greetings 完整:')
console.log(ag1.slice(0, 500))
console.log('---')
console.log('莫 alternate_greetings 完整:')
console.log(ag2.slice(0, 500))

console.log('')
console.log('=== extensions ===')
const ex1 = d1.extensions || {}
const ex2 = d2.extensions || {}
const exKeys = [...new Set([...Object.keys(ex1), ...Object.keys(ex2)])]
for (const k of exKeys) {
  const v1 = JSON.stringify(ex1[k] ?? '')
  const v2 = JSON.stringify(ex2[k] ?? '')
  const match = v1 === v2 ? '✅' : '❌'
  console.log(`${match} extensions.${k}:`.padEnd(25), '艾:', v1.slice(0, 80), '| 莫:', v2.slice(0, 80))
}

// tavern_helper 深层对比
console.log('')
console.log('=== tavern_helper 深层对比 ===')
const th1 = ex1.tavern_helper || {}
const th2 = ex2.tavern_helper || {}
console.log('艾 tavern_helper:', JSON.stringify(th1).slice(0, 200))
console.log('莫 tavern_helper:', JSON.stringify(th2).slice(0, 200))

// regex_scripts 对比
console.log('')
console.log('=== regex_scripts ===')
const rs1 = ex1.regex_scripts || []
const rs2 = ex2.regex_scripts || []
console.log('艾 regex_scripts:', rs1.length, '条')
console.log('莫 regex_scripts:', rs2.length, '条')
if (rs1.length) console.log('艾 [0]:', JSON.stringify(rs1[0]).slice(0, 200))
if (rs2.length) console.log('莫 [0]:', JSON.stringify(rs2[0]).slice(0, 200))

console.log('')
console.log('=== character_book ===')
const cb1 = d1.character_book || {}
const cb2 = d2.character_book || {}
console.log('艾 entries:', cb1.entries?.length || 0)
console.log('莫 entries:', cb2.entries?.length || 0)
console.log('艾 book name:', cb1.name || '')
console.log('莫 book name:', cb2.name || '')

// group_only_greetings
console.log('')
console.log('=== group_only_greetings ===')
console.log('艾:', d1.group_only_greetings?.length || 0)
console.log('莫:', d2.group_only_greetings?.length || 0)

console.log('')
console.log('=== PNG 元数据 ===')
console.log('艾 PNG:', buf1.length, 'bytes')
console.log('莫 PNG:', buf2.length, 'bytes')
