import fs from 'fs'

let html = fs.readFileSync('D:/.openclaw/workspace/projects/Mornsaelia-tavern/src/莫恩瑟利亚/前端/index.html', 'utf-8')

// Move <style> from <head> to <body> (tavern_helper's $('body').load() only keeps <body> content)
const styleMatch = html.match(/<style>[\s\S]*?<\/style>/)
if (styleMatch) {
  const style = styleMatch[0]
  // Insert at beginning of body
  html = html.replace('<body>', '<body>\n' + style + '\n')
  // Remove the original style from head
  html = html.replace('<style>', '<!-- style moved to body -->')
  html = html.replace('</style>', '')
  // Fix the comment
  html = html.replace('<!-- style moved to body -->', '')
}

// Also move the fontawesome link into body
const linkMatch = html.match(/<link[^>]*fontawesome[^>]*>/)
if (linkMatch) {
  html = html.replace(linkMatch[0], '') // remove from head
  html = html.replace('<body>', '<body>\n' + linkMatch[0] + '\n') // add to body start
}

// Clean up any extra blank lines
html = html.replace(/\n{3,}/g, '\n\n')

fs.writeFileSync('D:/.openclaw/workspace/projects/Mornsaelia-tavern/src/莫恩瑟利亚/前端/index.html', html)
console.log('✅ CSS and fonts moved into <body> for $("body").load() compatibility')
