import fs from 'fs'
const html = fs.readFileSync('D:/.openclaw/workspace/projects/Mornsaelia-tavern/src/莫恩瑟利亚/前端/index.html', 'utf-8')
const b64 = Buffer.from(html, 'utf-8').toString('base64')
const loader = '<script>document.write(atob("' + b64 + '"));</script>'
console.log('Loader:', loader.length, 'chars')
fs.writeFileSync('D:/.openclaw/workspace/projects/Mornsaelia-tavern/dist/loader.txt', loader)
