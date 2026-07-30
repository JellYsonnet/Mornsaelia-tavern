/**
 * 莫恩瑟利亚 v2.4 — regex_scripts + $1 捕获组方案
 */

import fs from 'fs'
import zlib from 'zlib'

const root = 'D:/.openclaw/workspace/projects/Mornsaelia-tavern'
const firstMsg = fs.readFileSync(root + '/src/莫恩瑟利亚/角色卡/第一条消息/0.md', 'utf-8').trim()

const scriptCode = fs.readFileSync(root + '/src/莫恩瑟利亚/脚本/index.ts', 'utf-8')
const inlineScript = '(function(){' + scriptCode
  .replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\n\s*/g, ' ').replace(/\s{2,}/g, ' ')
  .replace(/\s*([{}();,:<>=+\-*/!])\s*/g, '$1')
  + '})()'

console.log(`📦 内联脚本: ${inlineScript.length} 字符`)

// regex 注入（使用 $1 捕获组替代 $&）
const regexScripts = [{
  id: 'mornsaelia_panel',
  scriptName: '莫恩瑟利亚面板',
  disabled: false,
  runOnEdit: false,
  findRegex: '/(.*)/s',
  replaceString: '<script>' + inlineScript + '</script>\n$1',
  placement: [2],
  markdownOnly: true,
  promptOnly: false,
  substituteRegex: false,
}]

const card = {
  name: '莫恩瑟利亚', spec: 'chara_card_v3', spec_version: '3.0',
  description: '开放世界RPG — 脚本面板',
  personality: 'GM。引导冒险、扮演NPC、管理D20检定。',
  scenario: '玩家在莫恩瑟利亚大陆苏醒，探索地图，与NPC互动，接受任务，战斗成长。',
  first_mes: firstMsg,
  mes_example: '',
  creatorcomment: '渊琳 v2.4',
  avatar: 'none',
  talkativeness: '0.5',
  fav: false,
  tags: ['RPG', '开放世界', '脚本面板', '莫恩瑟利亚'],
  data: {
    name: '莫恩瑟利亚',
    description: '开放世界RPG — 脚本面板',
    personality: 'GM。引导冒险、扮演NPC、管理D20检定。',
    scenario: '玩家在莫恩瑟利亚大陆苏醒，探索地图，与NPC互动，接受任务，战斗成长。',
    first_mes: firstMsg,
    mes_example: '',
    creator_notes: '渊琳 v2.4 — regex 脚本 + $1 捕获',
    character_version: 'v2.4',
    system_prompt: 'GM。描述场景、扮演NPC、D20检定。每次回复<status><options>。',
    post_history_instructions: '每次回复<status><options>。',
    tags: ['RPG', '开放世界', '脚本面板', '莫恩瑟利亚'],
    creator: '苏渊琳',
    alternate_greetings: [],
    extensions: {
      regex_scripts: regexScripts,
      depth_prompt: { prompt: '', depth: 4, role: 'system' },
      tavern_helper: [['scripts', []], ['variables', {}]],
    },
    character_book: {
      entries: [{
        id: 0, keys: [], constant: true, insertion_order: 1, enabled: true,
        position: 'before_char', content: '回复格式：<status><content><options>',
      }],
      name: '莫恩瑟利亚',
    },
  },
}

const jsonStr = JSON.stringify(card)
console.log(`📦 角色卡 JSON: ${(jsonStr.length / 1024).toFixed(1)} KB`)

// === PNG ===
function crc32(b) {
  let c = 0xFFFFFFFF; const t = new Int32Array(256)
  for (let i = 0; i < 256; i++) { let cr = i; for (let j = 0; j < 8; j++) cr = (cr & 1) ? 0xEDB88320 ^ (cr >>> 1) : cr >>> 1; t[i] = cr }
  for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0
}
function mc(t, d) {
  const l = Buffer.alloc(4); l.writeUInt32BE(d.length)
  const tb = Buffer.from(t, 'ascii'), cd = Buffer.concat([tb, d]), c = Buffer.alloc(4)
  c.writeUInt32BE(crc32(cd)); return Buffer.concat([l, tb, d, c])
}
function mt(k, d) {
  const data = Buffer.concat([Buffer.from(k + '\0', 'utf-8'), Buffer.from(d, 'utf-8')])
  const l = Buffer.alloc(4); l.writeUInt32BE(data.length)
  const tb = Buffer.from('tEXt', 'ascii'), cd = Buffer.concat([tb, data]), c = Buffer.alloc(4)
  c.writeUInt32BE(crc32(cd)); return Buffer.concat([l, tb, data, c])
}

const w = 256, h = 256, raw = Buffer.alloc((w * 4 + 1) * h)
for (let y = 0; y < h; y++) {
  const rs = y * (w * 4 + 1); raw[rs] = 0
  for (let x = 0; x < w; x++) {
    const p = rs + 1 + x * 4, bj = x < 4 || x >= w - 4 || y < 4 || y >= h - 4
    const d = Math.sqrt((x - 128) ** 2 + (y - 128) ** 2)
    if (bj) { raw[p] = 201; raw[p + 1] = 168; raw[p + 2] = 76; raw[p + 3] = 255 }
    else if (d < 28) { raw[p] = 201; raw[p + 1] = 168; raw[p + 2] = 76; raw[p + 3] = 200 }
    else { raw[p] = 13; raw[p + 1] = 10; raw[p + 2] = 8; raw[p + 3] = 255 }
  }
}
const id = zlib.deflateSync(raw), ih = Buffer.alloc(13)
ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6
const sg = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
let png = Buffer.concat([sg, mc('IHDR', ih), mc('IDAT', id), mc('IEND', Buffer.alloc(0))])
function ins(p, c) { let i = 8; while (i < p.length - 4) { if (p.slice(i + 4, i + 8).toString() === 'IEND') break; i += 12 + p.readUInt32BE(i) }; return Buffer.concat([p.slice(0, i), c, p.slice(i)]) }
const b64 = Buffer.from(jsonStr, 'utf-8').toString('base64')
png = ins(png, mt('chara', b64)); png = ins(png, mt('ccv3', b64))

fs.mkdirSync(root + '/dist/莫恩瑟利亚/角色卡', { recursive: true })
fs.writeFileSync(root + '/dist/莫恩瑟利亚/角色卡/莫恩瑟利亚.png', png)
console.log(`✅ 已生成: ${(png.length / 1024).toFixed(1)} KB`)
