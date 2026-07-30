import fs from 'fs'
import zlib from 'zlib'

// Read the current frontend HTML
let html = fs.readFileSync('D:/.openclaw/workspace/projects/Mornsaelia-tavern/src/莫恩瑟利亚/前端/index.html', 'utf-8')

// Add iframe escape code at the beginning of the <script>
const escapeCode = [
  'if(window!==window.top){',
  '  var doc=window.top.document;',
  '  doc.body.innerHTML="<style>body{margin:0;overflow:hidden;background:#1a0f0a}</style>";',
  '  var p=doc.createElement("div");',
  '  p.id="mornsaelia-out";',
  '  p.style.cssText="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;overflow:hidden;background:#1a0f0a";',
  '  doc.body.appendChild(p);',
  '  p.innerHTML=document.body.innerHTML;',
  '}',
].join('\n')

html = html.replace('<script>', '<script>\n' + escapeCode + '\n')

fs.writeFileSync('D:/.openclaw/workspace/projects/Mornsaelia-tavern/dist/莫恩瑟利亚/前端/index.html', html)
console.log('✅ Updated frontend HTML with iframe escape')
