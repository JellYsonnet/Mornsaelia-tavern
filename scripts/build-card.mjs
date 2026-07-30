/**
 * cards build script
 * 构建角色卡 PNG（chara_card_v3）
 * 使用客户端 PNG 卡模板合并 YAML 数据
 *
 * 当前版本：输出 JSON 格式的卡数据
 * PNG 合成需要额外工具或手动导入 SillyTavern
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const srcCardDir = path.join(root, 'src/莫恩瑟利亚/角色卡')
const distCardDir = path.join(root, 'dist/莫恩瑟利亚/角色卡')

// 确保目标目录存在
fs.mkdirSync(distCardDir, { recursive: true })

// 读取 YAML 定义
const yamlPath = path.join(srcCardDir, 'index.yaml')
const raw = fs.readFileSync(yamlPath, 'utf-8')
const cardDef = yaml.load(raw)

// 读取第一条消息
const firstMsgPath = path.join(srcCardDir, '第一条消息/1.md')
const firstMsg = fs.existsSync(firstMsgPath)
  ? fs.readFileSync(firstMsgPath, 'utf-8')
  : cardDef.first_mes || ''

// 构建 chara_card_v3 格式
const card = {
  name: cardDef.name,
  description: cardDef.description,
  personality: cardDef.personality || '',
  scenario: cardDef.scenario || '',
  first_mes: firstMsg,
  mes_example: '',
  metadata: {
    version: 1,
    created: new Date().toISOString(),
    author: cardDef.author || 'unknown',
    spec: 'chara_card_v3',
  },
  system_prompt: cardDef.system_prompt || '',
  post_history_instructions: cardDef.post_history_instructions || '',
  tags: ['rpg', 'fantasy', 'open-world', 'mornsaelia'],
  creator: cardDef.author || 'unknown',
  character_version: cardDef.version || '1.0.0',
  extensions: {},
  data: {
    system_prompt: cardDef.system_prompt || '',
    post_history_instructions: cardDef.post_history_instructions || '',
    character_book: {
      entries: [],
    },
    alternate_greetings: cardDef.alternate_greetings || [],
  },
}

// 读取世界书条目
const worldBookDir = path.join(srcCardDir, '世界书')
if (fs.existsSync(worldBookDir)) {
  const entries = fs.readdirSync(worldBookDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
  for (const file of entries) {
    const entryRaw = fs.readFileSync(path.join(worldBookDir, file), 'utf-8')
    const entry = yaml.load(entryRaw)
    card.data.character_book.entries.push({
      id: `wb_${entries.indexOf(file) + 1}`,
      name: entry.key || file.replace(/\.(yaml|yml)$/, ''),
      type: entry.type || 'unset',
      key: entry.key || file.replace(/\.(yaml|yml)$/, ''),
      content: entry.content || '',
      priority: entry.priority || 4,
      selective: true,
      insertion_order: entries.indexOf(file),
      enabled: true,
      position: 'before_char',
      constant: false,
      delay_until_recursion: false,
    })
  }
}

// 输出 JSON
const jsonPath = path.join(distCardDir, '莫恩瑟利亚.json')
fs.writeFileSync(jsonPath, JSON.stringify({ 
  spec: 'chara_card_v3',
  spec_version: '3.0',
  data: card,
}, null, 2), 'utf-8')

console.log(`✅ 角色卡 JSON 已生成: ${jsonPath}`)
console.log(`📦 世界书条目: ${card.data.character_book.entries.length} 条`)
console.log('')
console.log('⚠️ 提示: 将 JSON 导入 SillyTavern 即可使用')
console.log('   PNG 卡面需使用 SillyTavern 的「导出为 PNG」功能生成')
console.log('   或使用 tavern-sync 工具在发布时自动生成')
