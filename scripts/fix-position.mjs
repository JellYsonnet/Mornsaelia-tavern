import fs from 'fs'
let h = fs.readFileSync('D:/.openclaw/workspace/projects/Mornsaelia-tavern/src/莫恩瑟利亚/前端/index.html', 'utf-8')
const old = 'html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--text);font-family:"Segoe UI","Noto Sans SC","Microsoft YaHei",sans-serif;margin:0;padding:0;font-size:15px}'
const nw = 'html,body{position:fixed;top:0;left:0;width:100vw;height:100vh;overflow:hidden;background:var(--bg);color:var(--text);font-family:"Segoe UI","Noto Sans SC","Microsoft YaHei",sans-serif;margin:0;padding:0;z-index:99999;font-size:15px}'
h = h.split(old).join(nw)
h = h.replace('.container{display:flex;flex-direction:column;height:100vh', '.container{display:flex;flex-direction:column;height:100%')
fs.writeFileSync('D:/.openclaw/workspace/projects/Mornsaelia-tavern/src/莫恩瑟利亚/前端/index.html', h)
console.log('OK')
