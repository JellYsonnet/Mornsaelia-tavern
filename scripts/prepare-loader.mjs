import fs from 'fs'

const root = 'D:/.openclaw/workspace/projects/Mornsaelia-tavern'
let html = fs.readFileSync(root + '/src/莫恩瑟利亚/前端/index.html', 'utf-8')
  .replace(/</g, '\\074')
  .replace(/>/g, '\\076')

const script = '<script>document.write("' + html + '");</script>'
console.log('Loader script:', script.length, 'chars')
fs.writeFileSync(root + '/src/莫恩瑟利亚/脚本/loader.txt', script)
