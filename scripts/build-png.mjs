/**
 * 莫恩瑟利亚 v2.1 — tavern_helper 脚本方案
 * 
 * 前端面板作为 tavern_helper 脚本运行在酒馆主文档层级，
 * 创建 fixed 定位面板，完全不受消息楼层 CSS transform 影响。
 */

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const firstMsg = fs.readFileSync(root + '/src/莫恩瑟利亚/角色卡/第一条消息/0.md', 'utf-8').trim()

// 读取脚本内容
const scriptCode = fs.readFileSync(root + '/src/莫恩瑟利亚/脚本/index.ts', 'utf-8').trim()

// tavern_helper 脚本定义
const tavernHelperScripts = [[
  'scripts',
  [{
    id: 'mornsaelia_rpg_panel',
    name: '莫恩瑟利亚 RPG 面板',
    type: 'script',
    enabled: true,
    content: scriptCode,
    info: '全屏 RPG 面板，显示状态/叙事/背包/选项',
    button: {
      enabled: true,
      buttons: [
        { name: '切换面板', visible: true },
      ],
    },
  }],
]]

const altGreeting = [
  '```',
  '<body>',
  `<script>`,
  `// 莫恩瑟利亚 RPG 面板已加载`,
  `// 请在 酒馆助手 → 脚本 中启用「莫恩瑟利亚 RPG 面板」`,
  `// 或者直接点击输入框上方的按钮`,
  `</script>`,
  '</body>',
  '```',
].join('\n')

const systemPrompt = [
  '你是莫恩瑟利亚世界的GM。规则遵循D&D 5e简化版（六属性）。d20检定。',
  '',
  '## 输出格式',
  '1. <status> — HP:当前/最大 | MP:当前/最大 | LV:N | EXP:N/N | 位置:地名',
  '2. 叙事正文',
  '3. <options> — N. [属性DC] 选项 或 N. 纯文本',
  '',
  "## 变量指令 $$ MOD('player.hp', delta) $$",
].join('\n')

const postHistory = '每次回复必须包含<status>、叙事、<options>。'

const card = {
  name: '莫恩瑟利亚',
  description: '开放世界RPG — tavern_helper 脚本面板',
  personality: 'GM。引导冒险、扮演NPC、管理D20检定。沉浸幻想叙事。',
  scenario: '玩家在莫恩瑟利亚大陆苏醒，探索地图，与NPC互动，接受任务，战斗成长。',
  first_mes: '## 【莫恩瑟利亚】v2.1\n___\n> 请启用 酒馆助手→脚本→莫恩瑟利亚 RPG 面板\n___\n**开始冒险→**',
  mes_example: '',
  creatorcomment: '渊琳 v2.1',
  avatar: 'none',
  talkativeness: '0.5',
  fav: false,
  tags: ['RPG', '开放世界', '脚本面板', '莫恩瑟利亚'],
  spec: 'chara_card_v3',
  spec_version: '3.0',
  data: {
    name: '莫恩瑟利亚',
    description: '开放世界RPG — tavern_helper 脚本面板',
    personality: 'GM。引导冒险、扮演NPC、管理D20检定。沉浸幻想叙事。',
    scenario: '玩家在莫恩瑟利亚大陆苏醒，探索地图，与NPC互动，接受任务，战斗成长。',
    first_mes: firstMsg,
    mes_example: '',
    creator_notes: '渊琳 v2.1 — tavern_helper 脚本全屏面板',
    character_version: 'v2.1',
    system_prompt: systemPrompt,
    post_history_instructions: postHistory,
    tags: ['RPG', '开放世界', '脚本面板', '莫恩瑟利亚'],
    creator: '苏渊琳',
    alternate_greetings: [altGreeting],
    extensions: {
      talkativeness: '0.5',
      fav: false,
      world: '莫恩瑟利亚',
      depth_prompt: { prompt: '', depth: 4, role: 'system' },
      tavern_helper: tavernHelperScripts,
    },
    group_only_greetings: [],
    character_book: {
      entries: [
        {
          id: 0, keys: [], constant: true, insertion_order: 1, enabled: true,
          position: 'before_char', use_regex: true,
          extensions: { position: 0, depth: 4, probability: 100, useProbability: true },
          content: '回复格式：<status><content><options>',
        },
        {
          id: 1, keys: ['莫恩瑟利亚'], constant: false, insertion_order: 50, enabled: true,
          position: 'before_char', use_regex: false, selective: true,
          extensions: { position: 0, depth: 4, probability: 100, useProbability: true },
          content: '<系统设定>莫恩瑟利亚。六属性STR/DEX/CON/INT/WIS/CHA。等级1-30。D20检定。</系统设定>',
        },
      ],
      name: '莫恩瑟利亚',
    },
  },
}

const jsonStr = JSON.stringify(card)
console.log(`📦 角色卡 JSON: ${(jsonStr.length / 1024).toFixed(1)} KB (含脚本 ${(scriptCode.length / 1024).toFixed(1)} KB)`)

// === PNG 生成 ===
function crc32(b) {
  let c = 0xFFFFFFFF; const t = new Int32Array(256)
  for (let i = 0; i < 256; i++) { let cr = i; for (let j = 0; j < 8; j++) cr = (cr & 1) ? 0xEDB88320 ^ (cr >>> 1) : cr >>> 1; t[i] = cr }
  for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
function mc(t, d) {
  const tb = Buffer.from(t, 'ascii'), l = Buffer.alloc(4)
  l.writeUInt32BE(d.length)
  const cd = Buffer.concat([tb, d]), c = Buffer.alloc(4)
  c.writeUInt32BE(crc32(cd))
  return Buffer.concat([l, tb, d, c])
}
function mt(k, d) {
  const data = Buffer.concat([Buffer.from(k + '\0', 'utf-8'), Buffer.from(d, 'utf-8')])
  const tb = Buffer.from('tEXt', 'ascii'), l = Buffer.alloc(4)
  l.writeUInt32BE(data.length)
  const cd = Buffer.concat([tb, data]), c = Buffer.alloc(4)
  c.writeUInt32BE(crc32(cd))
  return Buffer.concat([l, tb, data, c])
}

// 256×256 RGBA
const w = 256, h = 256
const raw = Buffer.alloc((w * 4 + 1) * h)
for (let y = 0; y < h; y++) {
  const rs = y * (w * 4 + 1); raw[rs] = 0
  for (let x = 0; x < w; x++) {
    const p = rs + 1 + x * 4, border = x < 4 || x >= w - 4 || y < 4 || y >= h - 4
    const d = Math.sqrt((x - 128) ** 2 + (y - 128) ** 2)
    if (border) { raw[p] = 201; raw[p + 1] = 168; raw[p + 2] = 76; raw[p + 3] = 255 }
    else if (d < 28) { raw[p] = 201; raw[p + 1] = 168; raw[p + 2] = 76; raw[p + 3] = 200 }
    else { raw[p] = 13; raw[p + 1] = 10; raw[p + 2] = 8; raw[p + 3] = 255 }
  }
}
const id = zlib.deflateSync(raw)
const ih = Buffer.alloc(13)
ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6

const sg = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
let png = Buffer.concat([sg, mc('IHDR', ih), mc('IDAT', id), mc('IEND', Buffer.alloc(0))])

function ins(p, c) {
  let i = 8
  while (i < p.length - 4) { if (p.slice(i + 4, i + 8).toString() === 'IEND') break; i += 12 + p.readUInt32BE(i) }
  return Buffer.concat([p.slice(0, i), c, p.slice(i)])
}

const b64 = Buffer.from(jsonStr, 'utf-8').toString('base64')
png = ins(png, mt('chara', b64))
png = ins(png, mt('ccv3', b64))

const outDir = root + '/dist/莫恩瑟利亚/角色卡'
fs.mkdirSync(outDir, { recursive: true })
const outPath = root + '/dist/莫恩瑟利亚/角色卡/莫恩瑟利亚.png'
fs.writeFileSync(outPath, png)
console.log(`✅ 已生成: ${outPath}`)
console.log(`📏 ${w}×${h} | 📦 ${(png.length / 1024).toFixed(1)} KB`)

// 验证
function verify(buf) {
  let off = 8, hasC = false, hasC2 = false
  while (off < buf.length - 4) {
    const len = buf.readUInt32BE(off), t = buf.slice(off + 4, off + 8).toString()
    if (t === 'tEXt') {
      const n = buf.indexOf(0, off + 8), k = buf.slice(off + 8, n).toString()
      if (k === 'chara') hasC = true
      if (k === 'ccv3') hasC2 = true
    }
    if (t === 'IEND') break
    off += 12 + len
  }
  console.log(`🔍 chara: ${hasC ? '✅' : '❌'} | ccv3: ${hasC2 ? '✅' : '❌'}`)
  // 验证 JSON 中有脚本
  if (hasC) {
    const n = buf.indexOf(0, 8)
    // Simplified
  }
}
verify(png)
