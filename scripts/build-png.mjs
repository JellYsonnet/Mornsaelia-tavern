/**
 * 莫恩瑟利亚 v2.5 — 自包含 HTML 方案
 * 
 * 参考凡人修仙传：关键词触发 regex → 完全覆写消息为自包含 HTML
 * HTML 在消息楼层内用相对定位布局
 */

import fs from 'fs'
import zlib from 'zlib'

const root = 'D:/.openclaw/workspace/projects/Mornsaelia-tavern'

const firstMsg = [
  '【欢迎来到莫恩瑟利亚】',
  '',
  '你缓缓睁开眼，发现自己躺在一片柔软的苔藓上。',
  '阳光透过茂密的树冠洒落，空气中弥漫着泥土和野花的芬芳。',
  '',
  '<status>',
  'HP: 100/100 | MP: 50/50 | LV: 1 | EXP: 0/100',
  '位置: 起始之森',
  '</status>',
  '',
  '<options>',
  '1. 深入森林探索',
  '2. 沿着溪流寻找水源',
  '3. 检查那封泛黄的信笺',
  '</options>',
].join('\n')

// 自包含前端 HTML（在消息楼层内渲染的 RPG 面板）
const panelHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--p:#c9a84c;--s:#2c1810;--bg:#1a0f0a;--pl:#2a1a10;--tx:#e8dcc8;--dm:#8a7a6a;--br:#4a3a2a}
body{font-family:'Segoe UI','Noto Sans SC','Microsoft YaHei',sans-serif;background:var(--bg);color:var(--tx);padding:8px;min-height:100vh}
.p{background:var(--pl);border:1px solid var(--br);border-radius:6px;padding:8px;margin:0 0 6px}
.p h3{font-size:11px;color:var(--p);margin:0 0 6px;padding-bottom:3px;border-bottom:1px solid var(--br)}
.p h3 i{margin-right:4px}
.hud{display:flex;gap:6px;flex-wrap:wrap;font-size:11px;margin-bottom:6px}
.hud-item{background:var(--pl);border:1px solid var(--br);border-radius:4px;padding:2px 6px}
.hud-item i{color:var(--p);margin-right:3px}
.main{display:flex;gap:4px;flex-wrap:wrap}
.left,.right{width:130px;flex-shrink:0}
.center{flex:1;min-width:200px}
.sr,.er{display:flex;justify-content:space-between;font-size:11px;padding:1px 0}
.sl{color:var(--dm)}.sv{color:var(--tx);font-weight:bold}.ei{color:var(--p)}
.narr{max-height:150px;overflow-y:auto;font-size:12px;line-height:1.6}
.narr p{margin:0 0 3px}
.narr .sys{color:var(--p);font-style:italic}
.opt-btn{display:block;width:100%;text-align:left;background:rgba(201,168,76,0.08);border:1px solid var(--br);color:var(--tx);padding:3px 6px;margin:2px 0;border-radius:3px;cursor:pointer;font-size:11px}
.opt-btn:hover{background:rgba(201,168,76,0.2);border-color:var(--p)}
.opt-n{display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;background:var(--p);color:var(--bg);border-radius:50%;font-size:8px;font-weight:bold;margin-right:4px}
.item-r{display:flex;align-items:center;gap:4px;font-size:11px;padding:1px 0;cursor:pointer}
.item-r:hover{background:rgba(201,168,76,0.1)}
.empty{color:var(--dm);font-size:10px;font-style:italic}
.exp-bar{height:4px;background:var(--bg);border-radius:2px;overflow:hidden;margin:3px 0}
.exp-fill{height:100%;background:linear-gradient(90deg,var(--p),#e8c84c);border-radius:2px;transition:width .3s}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:var(--br);border-radius:2px}
@media(max-width:500px){.left,.right{width:100%}}
</style>
</head>
<body>
<div id="app">
<div class="hud">
<span class="hud-item"><i class="fas fa-heart"></i> <span id="hp">100</span>/<span id="hpm">100</span></span>
<span class="hud-item"><i class="fas fa-star"></i> <span id="mp">50</span>/<span id="mpm">50</span></span>
<span class="hud-item"><i class="fas fa-level-up-alt"></i> Lv.<span id="lv">1</span></span>
<span class="hud-item"><i class="fas fa-map-pin"></i> <span id="loc">起始之森</span></span>
</div>
<div class="main">
<div class="left">
<div class="p"><h3><i class="fas fa-crown"></i> 属性</h3><div id="stats"></div></div>
<div class="p" style="margin-bottom:0"><h3><i class="fas fa-shield-alt"></i> 装备</h3><div id="equip"></div></div>
</div>
<div class="center">
<div class="p"><h3><i class="fas fa-book"></i> 叙事</h3><div class="narr" id="narr"><p>🌿 欢迎来到莫恩瑟利亚。</p></div></div>
<div class="p" id="optbox" style="display:none;margin-bottom:0"><h3><i class="fas fa-list"></i> 行动</h3><div id="opts"></div></div>
</div>
<div class="right">
<div class="p"><h3><i class="fas fa-shopping-bag"></i> 背包</h3><div id="inv"><span class="empty">空的</span></div></div>
<div class="p" style="margin-bottom:0"><h3><i class="fas fa-tasks"></i> 任务</h3><div id="quest"><span class="empty">无</span></div></div>
</div>
</div>
<div class="exp-bar"><div class="exp-fill" id="expb" style="width:0%"></div></div>
</div>
<script>
function parse(t){
  var sm=t.match(/<status>([\\s\\S]*?)<\\/status>/)
  if(sm){var b=sm[1]
    var h=b.match(/HP\\s*:\\s*(\\d+)\\/(\\d+)/i);if(h){document.getElementById('hp').textContent=h[1];document.getElementById('hpm').textContent=h[2]}
    var m=b.match(/MP\\s*:\\s*(\\d+)\\/(\\d+)/i);if(m){document.getElementById('mp').textContent=m[1];document.getElementById('mpm').textContent=m[2]}
    var l=b.match(/LV\\s*:\\s*(\\d+)/i);if(l)document.getElementById('lv').textContent=l[1]}
  var om=t.match(/<options>([\\s\\S]*?)<\\/options>/)
  var ob=document.getElementById('optbox'),od=document.getElementById('opts')
  if(om){ob.style.display='block';od.innerHTML=''
    om[1].split('\\n').forEach(function(l){var m=l.match(/^\\d+\\.\\s*(.*?)(?:\\[([^\\]]+)\\])?\\s*$/);if(m){var b=document.createElement('button');b.className='opt-btn';b.innerHTML='<span class="opt-n">'+(od.children.length+1)+'</span>'+m[1];if(m[2])b.innerHTML+='<span style="color:var(--dm);font-size:9px;margin-left:3px">['+m[2]+']</span>';b.onclick=function(){var ta=document.querySelector('#send_textarea,textarea');if(ta){ta.value=m[1];ta.dispatchEvent(new Event('input',{bubbles:true}));var sb=document.querySelector('#send_but,.send_but');if(sb)sb.click()}};od.appendChild(b)}})
  }else ob.style.display='none'}
var lt=''
setInterval(function(){
  var mes=document.querySelectorAll('.mes')
  if(mes.length){var t=(mes[mes.length-1].textContent||'').trim();if(t&&t!==lt&&t.length>10&t!=='...'){lt=t;parse(t)}}
},1000)
setTimeout(function(){var mes=document.querySelectorAll('.mes');if(mes.length)parse(mes[mes.length-1].textContent||'')},2000)
</script>
</body>
</html>`

// 压缩 HTML 作为替换字符串
const compactHTML = panelHTML.replace(/\n\s*/g, ' ').replace(/\s{2,}/g, ' ')

// regex_scripts：关键词触发，完全覆写
const regexScripts = [{
  id: 'mornsaelia_panel',
  scriptName: '莫恩瑟利亚面板',
  disabled: false,
  runOnEdit: false,
  findRegex: '/(莫恩瑟利亚)/s',
  replaceString: compactHTML,
  placement: [1, 2],
  markdownOnly: true,
  promptOnly: false,
  substituteRegex: false,
}]

const card = {
  name: '莫恩瑟利亚', spec: 'chara_card_v3', spec_version: '3.0',
  description: '开放世界RPG — 自包含HTML面板',
  personality: 'GM。引导冒险、扮演NPC、管理D20检定。',
  scenario: '玩家在莫恩瑟利亚大陆苏醒，探索地图，与NPC互动。',
  first_mes: firstMsg,
  mes_example: '',
  creatorcomment: '渊琳 v2.5',
  avatar: 'none',
  talkativeness: '0.5',
  fav: false,
  tags: ['RPG', '开放世界', 'HTML面板', '莫恩瑟利亚'],
  data: {
    name: '莫恩瑟利亚',
    description: '开放世界RPG — 自包含HTML面板',
    personality: 'GM。引导冒险、扮演NPC、管理D20检定。',
    scenario: '玩家在莫恩瑟利亚大陆苏醒，探索地图，与NPC互动。',
    first_mes: firstMsg,
    mes_example: '',
    creator_notes: '渊琳 v2.5 — 自包含HTML + 关键词触发',
    character_version: 'v2.5',
    system_prompt: 'GM。描述场景、扮演NPC、D20检定。每次回复<status><options>。',
    post_history_instructions: '每次回复<status><options>。',
    tags: ['RPG', '开放世界', 'HTML面板', '莫恩瑟利亚'],
    creator: '苏渊琳',
    alternate_greetings: ['莫恩瑟利亚'],
    extensions: {
      regex_scripts: regexScripts,
      depth_prompt: { prompt: '', depth: 4, role: 'system' },
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
console.log(`📦 HTML: ${(compactHTML.length / 1024).toFixed(1)} KB`)
console.log(`📦 JSON: ${(jsonStr.length / 1024).toFixed(1)} KB`)

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
