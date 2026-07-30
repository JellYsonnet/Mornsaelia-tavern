/**
 * 合成 chara_card_v3 PNG 卡面 — v3
 * 完全匹配 v8 工作卡的方式
 *
 * - tEXt chunk（非 zTXt）
 * - base64 编码 JSON
 * - 同时写入 chara + ccv3 两个 chunk
 * - 插入在 IEND 之前
 */

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dir = p => path.join(root, p)

// === 1. 构建角色卡 JSON ===

const firstMsg = fs.readFileSync(dir('src/莫恩瑟利亚/角色卡/第一条消息/1.md'), 'utf-8').trim()

const systemPrompt = [
  '你是莫恩瑟利亚世界的GM。',
  '规则遵循D&D 5e简化版（六属性：力量/敏捷/体质/智力/感知/魅力）。',
  '每次骰子判定采用d20。',
  '',
  '## 输出格式',
  '每次回复必须严格按照三段式：',
  '1. <status> 标签',
  '2. 叙事正文',
  '3. <exits> + <options> 标签',
  '4. <小总结> 归档协议',
  '',
  '## 变量指令',
  "$$ MOD('player.hp', delta) $$ 等",
].join('\n')

const postHistory = [
  '每次回复必须包含 <status>、叙事正文、<options>。',
  "变量指令放在对应操作之后。",
].join('\n')

const personality = '你是莫恩瑟利亚开放世界的游戏主持人（GM）。引导冒险、扮演NPC、管理规则。'

const scenario = '玩家在莫恩瑟利亚大陆苏醒，记忆模糊。可以自由探索地图，与NPC互动，接受任务，战斗成长。'

// 世界书
const wbDir = dir('src/莫恩瑟利亚/角色卡/世界书')
const wbEntries = []
if (fs.existsSync(wbDir)) {
  const files = fs.readdirSync(wbDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
  for (const [i, file] of files.entries()) {
    const raw = fs.readFileSync(path.join(wbDir, file), 'utf-8')
    const get = (k) => { const m = raw.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')); return m ? m[1].trim() : '' }
    const getMultiline = (k) => {
      const m = raw.match(new RegExp(`^${k}:\\s*\\|\\s*$`, 'm'))
      if (!m) return get(k)
      const after = raw.slice(m.index + m[0].length)
      const lines = []
      for (const line of after.split('\n')) {
        if (line.trim() === '') continue
        if (line.trim().length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) break
        if (!line.trim()) continue
        lines.push(line.trim())
      }
      return lines.join('\n')
    }
    wbEntries.push({
      id: i,
      keys: [get('key') || ''],
      content: getMultiline('content') || '',
      constant: false,
      insertion_order: i,
      enabled: true,
      position: 'before_char',
      use_regex: false,
      extensions: {},
      priority: parseInt(get('priority') || '4'),
      name: get('key') || file.replace(/\.(yaml|yml)$/, ''),
      selective: true,
    })
  }
}

// alternate_greetings（base64 内嵌前端）
const frontendHtml = fs.readFileSync(dir('frontend/index.html'), 'utf-8')
  .replace(/\r\n/g, '\n')
const htmlB64 = Buffer.from(encodeURIComponent(frontendHtml)).toString('base64')

const altGreeting = [
  '```',
  '<body>',
  '<script>',
  'var h=decodeURIComponent(atob("' + htmlB64 + '"));',
  'var b=new Blob([h],{type:"text/html"});',
  'var u=URL.createObjectURL(b);',
  'window.open(u,"_blank");',
  '</script>',
  '</body>',
  '```',
].join('\n')

// 第一条消息（简洁版）
const fm = '## 【莫恩瑟利亚】\n___\n> 下拉招呼→新标签页打开前端。\n___\n**翻页开始→**'

// 构建完整 card JSON（模仿 v8 精确格式）
const card = {
  name: '莫恩瑟利亚',
  description: '开放世界RPG — 同层前端卡',
  personality,
  scenario,
  first_mes: fm,
  mes_example: '',
  creatorcomment: '渊琳',
  avatar: 'none',
  talkativeness: '0.5',
  fav: false,
  tags: ['RPG', '开放世界', '同层前端', '莫恩瑟利亚'],
  spec: 'chara_card_v3',
  spec_version: '3.0',
  data: {
    name: '莫恩瑟利亚',
    description: '开放世界RPG — 同层前端卡',
    personality,
    scenario,
    first_mes: fm,
    mes_example: '',
    creator_notes: '渊琳 — 新标签页',
    character_version: 'v1',
    system_prompt: systemPrompt,
    post_history_instructions: postHistory,
    tags: ['RPG', '开放世界', '同层前端', '莫恩瑟利亚'],
    creator: '苏渊琳',
    alternate_greetings: [altGreeting],
    extensions: {
      talkativeness: '0.5',
      fav: false,
      world: '莫恩瑟利亚',
      depth_prompt: { prompt: '', depth: 4, role: 'system' },
      tavern_helper: [['scripts', []], ['variables', {}]],
    },
    group_only_greetings: [],
    character_book: {
      entries: wbEntries,
      name: '莫恩瑟利亚',
    },
  },
}

const jsonStr = JSON.stringify(card)
console.log(`📦 JSON: ${(jsonStr.length / 1024).toFixed(1)} KB | ${JSON.stringify(card).length}`)

// === 2. 生成 PNG ===

// PNG utils（照搬 v8 风格）
function crc32(b) {
  let c = 0xFFFFFFFF
  const t = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let cr = i
    for (let j = 0; j < 8; j++) cr = (cr & 1) ? 0xEDB88320 ^ (cr >>> 1) : cr >>> 1
    t[i] = cr
  }
  for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function mc(t, d) {
  const tb = Buffer.from(t, 'ascii')
  const l = Buffer.alloc(4)
  l.writeUInt32BE(d.length)
  const cd = Buffer.concat([tb, d])
  const c = Buffer.alloc(4)
  c.writeUInt32BE(crc32(cd))
  return Buffer.concat([l, tb, d, c])
}

function mt(k, d) {
  return mc('tEXt', Buffer.concat([
    Buffer.from(k + '\0', 'utf-8'),
    Buffer.from(d, 'utf-8'),
  ]))
}

// 256×256 图像（同 v8 风格——深色背景 + 金色边框）
const w = 256, h = 256
const raw = Buffer.alloc((w * 4 + 1) * h)  // RGBA
for (let y = 0; y < h; y++) {
  const rs = y * (w * 4 + 1)
  raw[rs] = 0  // filter
  for (let x = 0; x < w; x++) {
    const p = rs + 1 + x * 4
    const border = x < 4 || x >= w - 4 || y < 4 || y >= h - 4
    const dx = x - 128, dy = y - 128
    const d = Math.sqrt(dx * dx + dy * dy)
    if (border) {
      raw[p] = 201; raw[p + 1] = 168; raw[p + 2] = 76; raw[p + 3] = 255       // 金色边框
    } else if (d < 28) {
      raw[p] = 201; raw[p + 1] = 168; raw[p + 2] = 76; raw[p + 3] = 200       // 金色中心光晕
    } else {
      raw[p] = 13; raw[p + 1] = 10; raw[p + 2] = 8; raw[p + 3] = 255          // 深色背景
    }
  }
}

const id = zlib.deflateSync(raw)
const ih = Buffer.alloc(13)
ih.writeUInt32BE(w, 0)
ih.writeUInt32BE(h, 4)
ih[8] = 8; ih[9] = 6  // RGBA

const sg = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
let png = Buffer.concat([sg, mc('IHDR', ih), mc('IDAT', id), mc('IEND', Buffer.alloc(0))])

// 插入 text chunk 到 IEND 之前
function ins(p, c) {
  let i = 8
  while (i < p.length - 4) {
    if (p.slice(i + 4, i + 8).toString() === 'IEND') break
    i += 12 + p.readUInt32BE(i)
  }
  return Buffer.concat([p.slice(0, i), c, p.slice(i)])
}

const b64 = Buffer.from(jsonStr, 'utf-8').toString('base64')
png = ins(png, mt('chara', b64))
png = ins(png, mt('ccv3', b64))

// === 3. 输出 ===

const outDir = dir('dist/莫恩瑟利亚/角色卡')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, '莫恩瑟利亚.png')
fs.writeFileSync(outPath, png)

console.log(`\n✅ 已生成: ${outPath}`)
console.log(`📏 ${w}×${h} RGBA | 📦 ${(png.length / 1024).toFixed(1)} KB`)

// 验证
function verify(buf) {
  let ok = buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a'
  let c = 0, hasC = false, hasC2 = false
  let off = 8
  while (off < buf.length - 4) {
    const len = buf.readUInt32BE(off)
    const t = buf.slice(off + 4, off + 8).toString()
    if (t === 'tEXt' || t === 'zTXt') {
      const n = buf.indexOf(0, off + 8)
      const k = buf.slice(off + 8, n).toString()
      if (k === 'chara') { c++; hasC = true }
      if (k === 'ccv3') { c++; hasC2 = true }
    }
    if (t === 'IEND') break
    off += 12 + len
  }
  console.log(`🔍 PNG: ${ok ? '✅' : '❌'} | chara: ${hasC ? '✅' : '❌'} | ccv3: ${hasC2 ? '✅' : '❌'}`)
}
verify(png)
