<template>
  <div class="mornsaelia-container" :style="themeVars">
    <!-- 顶部：状态栏 HUD -->
    <header class="hud">
      <div class="hud-row">
        <span class="hud-item"><i class="fas fa-heart"></i> HP {{ player.hp }}/{{ player.maxHp }}</span>
        <span class="hud-item"><i class="fas fa-star"></i> MP {{ player.mp }}/{{ player.maxMp }}</span>
        <span class="hud-item"><i class="fas fa-level-up-alt"></i> Lv.{{ player.level }}</span>
        <span class="hud-item"><i class="fas fa-map-pin"></i> {{ world.currentLocation }}</span>
        <span class="hud-item"><i class="fas fa-clock"></i> 第{{ gameTime.day }}日 {{ gameTime.hour }}:{{ ('0' + gameTime.minute).slice(-2) }}</span>
      </div>
      <div class="exp-bar">
        <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
        <span class="exp-text">EXP {{ player.exp }}/{{ player.expToNext }}</span>
      </div>
    </header>

    <!-- 主面板：三栏布局 -->
    <div class="main-panel">
      <!-- 左栏：属性 + 装备 -->
      <aside class="panel-left">
        <section class="panel-box stats-box">
          <h3><i class="fas fa-crown"></i> 属性</h3>
          <div v-for="(val, key) in player.stats" :key="key" class="stat-row">
            <span class="stat-label">{{ statNames[key as string] }}</span>
            <span class="stat-value">{{ val }}</span>
          </div>
        </section>
        <section class="panel-box equip-box">
          <h3><i class="fas fa-shield-alt"></i> 装备</h3>
          <div v-for="(slot, name) in player.equipment" :key="name" class="equip-row">
            <span class="equip-slot">{{ equipNames[name as string] }}</span>
            <span class="equip-item">{{ slot || '—' }}</span>
          </div>
        </section>
      </aside>

      <!-- 中栏：叙事 / 对话 -->
      <main class="panel-center">
        <section class="panel-box narrative-box">
          <div class="narrative-header">
            <span class="location-tag">{{ world.currentLocation }}</span>
            <div class="narrative-actions">
              <button @click="toggleLog" class="btn-icon" title="日志">
                <i class="fas fa-book-open"></i>
              </button>
              <button @click="scrollNarrative('top')" class="btn-icon" title="回顶部">
                <i class="fas fa-arrow-up"></i>
              </button>
            </div>
          </div>
          <div class="narrative-content" ref="narrativeRef">
            <p v-for="(line, i) in narrativeLog" :key="i" class="narrative-line" :class="line.type">
              <span v-if="line.type === 'system'" class="sys-tag">[系统]</span>
              {{ line.text }}
            </p>
          </div>
        </section>

        <!-- 选项 -->
        <section v-if="currentOptions.length" class="panel-box options-box">
          <h3><i class="fas fa-list"></i> 行动</h3>
          <button
            v-for="(opt, i) in currentOptions"
            :key="i"
            class="option-btn"
            @click="selectOption(opt)"
          >
            <span class="option-num">{{ i + 1 }}</span>
            <span class="option-text">{{ opt.label }}</span>
            <span v-if="opt.requirement" class="option-req">[{{ opt.requirement }}]</span>
          </button>
        </section>
      </main>

      <!-- 右栏：背包 + 任务 -->
      <aside class="panel-right">
        <section class="panel-box inventory-box">
          <h3><i class="fas fa-shopping-bag"></i> 背包 ({{ player.inventory.length }})</h3>
          <div v-if="!player.inventory.length" class="empty-hint">空空如也</div>
          <div v-for="(item, i) in player.inventory" :key="i" class="item-row" @click="useItem(item)">
            <span class="item-icon">{{ itemIcon(item) }}</span>
            <span class="item-name">{{ item.name }}</span>
            <span v-if="item.quantity" class="item-qty">×{{ item.quantity }}</span>
          </div>
        </section>
        <section class="panel-box quest-box">
          <h3><i class="fas fa-tasks"></i> 任务</h3>
          <div v-if="!player.quests.length" class="empty-hint">无活跃任务</div>
          <div v-for="(q, i) in player.quests" :key="i" class="quest-row">
            <span class="quest-name">{{ q.name }}</span>
            <span class="quest-status" :class="q.status">{{ statusText(q.status) }}</span>
          </div>
        </section>
      </aside>
    </div>

    <!-- 输入栏 -->
    <footer class="input-bar">
      <input
        v-model="chatInput"
        type="text"
        placeholder="输入你的行动…"
        class="chat-input"
        @keydown.enter="sendMessage"
      />
      <button class="send-btn" @click="sendMessage"><i class="fas fa-paper-plane"></i></button>
      <button class="save-btn" @click="saveGame" title="保存"><i class="fas fa-save"></i></button>
    </footer>

    <!-- 日志弹窗 -->
    <Teleport to="body">
      <div v-if="showLog" class="log-overlay" @click.self="showLog = false">
        <div class="log-panel">
          <h2>冒险日志</h2>
          <div class="log-content">
            <p v-for="(entry, i) in narrativeLog" :key="i" class="log-line">{{ entry.text }}</p>
          </div>
          <button @click="showLog = false" class="close-btn"><i class="fas fa-times"></i></button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted, nextTick } from 'vue'

// === 类型定义 ===
interface Stats {
  str: number; dex: number; con: number; int: number; wis: number; cha: number
}
interface Equipment { weapon: string | null; armor: string | null; accessory: string | null }
interface Item { name: string; type?: string; quantity?: number; description?: string }
interface Quest { name: string; status: 'active' | 'completed' | 'failed' }
interface NarrativeLine { text: string; type: 'narrative' | 'dialogue' | 'system' }
interface Option { label: string; command: string; requirement?: string }

interface GameState {
  player: {
    name: string; level: number; exp: number; expToNext: number
    hp: number; maxHp: number; mp: number; maxMp: number
    stats: Stats; equipment: Equipment
    inventory: Item[]; quests: Quest[]
  }
  world: { currentLocation: string }
  gameTime: { day: number; hour: number; minute: number }
}

// === 默认状态 ===
function defaultState(): GameState {
  return {
    player: {
      name: '旅人', level: 1, exp: 0, expToNext: 100,
      hp: 100, maxHp: 100, mp: 50, maxMp: 50,
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      equipment: { weapon: null, armor: null, accessory: null },
      inventory: [], quests: [],
    },
    world: { currentLocation: '起始之森' },
    gameTime: { day: 1, hour: 8, minute: 0 },
  }
}

const STORAGE_KEY = 'mornsaelia_save'

// === 组件 ===
export default defineComponent({
  name: '莫恩瑟利亚界面',
  setup() {
    // 主题色
    const themeVars = reactive({
      '--primary': '#c9a84c',
      '--secondary': '#2c1810',
      '--accent': '#8b0000',
      '--bg': '#1a0f0a',
      '--bg-panel': '#2a1a10',
      '--text': '#e8dcc8',
      '--text-dim': '#8a7a6a',
      '--border': '#4a3a2a',
    })

    // 游戏状态
    const player = reactive(defaultState().player)
    const world = reactive(defaultState().world)
    const gameTime = reactive(defaultState().gameTime)

    // UI 状态
    const chatInput = ref('')
    const narrativeLog = ref<NarrativeLine[]>([])
    const currentOptions = ref<Option[]>([])
    const showLog = ref(false)
    const narrativeRef = ref<HTMLElement | null>(null)

    // 标签显示名
    const statNames: Record<string, string> = { str: '力量', dex: '敏捷', con: '体质', int: '智力', wis: '感知', cha: '魅力' }
    const equipNames: Record<string, string> = { weapon: '武器', armor: '护甲', accessory: '饰品' }

    const expPercent = computed(() => Math.min(100, (player.exp / player.expToNext) * 100))

    function statusText(s: string) {
      return s === 'active' ? '进行中' : s === 'completed' ? '已完成' : '失败'
    }

    function itemIcon(item: Item) {
      const map: Record<string, string> = {
        weapon: '⚔️', armor: '🛡️', potion: '🧪', scroll: '📜', key: '🔑', food: '🍞', treasure: '💎',
      }
      return map[item.type || ''] || '📦'
    }

    // === 保存/读取 ===
    function saveGame() {
      const state: GameState = {
        player: JSON.parse(JSON.stringify(player)),
        world: { currentLocation: world.currentLocation },
        gameTime: { ...gameTime },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      addNarrative('游戏已保存', 'system')
    }

    function loadGame() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const state: GameState = JSON.parse(raw)
        Object.assign(player, state.player)
        Object.assign(world, state.world)
        Object.assign(gameTime, state.gameTime)
        addNarrative('存档已读取，欢迎回来。', 'system')
      } catch { /* ignore */ }
    }

    // === 叙事 ===
    function addNarrative(text: string, type: NarrativeLine['type'] = 'narrative') {
      narrativeLog.value.push({ text, type })
      nextTick(() => {
        if (narrativeRef.value) {
          narrativeRef.value.scrollTop = narrativeRef.value.scrollHeight
        }
      })
    }

    function toggleLog() { showLog.value = !showLog.value }
    function scrollNarrative(where: 'top' | 'bottom') {
      nextTick(() => {
        if (narrativeRef.value) {
          narrativeRef.value.scrollTop = where === 'top' ? 0 : narrativeRef.value.scrollHeight
        }
      })
    }

    // === 选项 ===
    function selectOption(opt: Option) {
      sendRaw(opt.command)
      currentOptions.value = []
    }

    // === 发送消息到酒馆 ===
    function sendMessage() {
      const text = chatInput.value.trim()
      if (!text) return
      sendRaw(text)
      chatInput.value = ''
    }

    function sendRaw(text: string) {
      addNarrative(`> ${text}`, 'narrative')
      // 尝试注入 SillyTavern 聊天框
      const taverInput = document.querySelector<HTMLTextAreaElement>('#send_textarea, textarea.message, .mes_textarea')
      if (taverInput) {
        taverInput.value = text
        taverInput.dispatchEvent(new Event('input', { bubbles: true }))
        const sendBtn = document.querySelector<HTMLElement>('#send_but, .send_but, button[title="发送"]')
        sendBtn?.click()
      } else {
        // 独立窗口模式：直接显示，用户手动复制到酒馆
        addNarrative(`[未检测到酒馆输入框，请手动将消息粘贴到酒馆发送]`, 'system')
        // 同时尝试复制到剪贴板
        navigator.clipboard.writeText(text).catch(() => {})
      }
    }

    // === 使用道具 ===
    function useItem(item: Item) {
      sendRaw(`[使用道具] ${item.name}`)
    }

    // === 解析 AI 标签 ===
    function parseAITags(text: string) {
      // <status>...</status>
      const statusMatch = text.match(/<status>([\s\S]*?)<\/status>/)
      if (statusMatch) {
        const block = statusMatch[1]
        const hpM = block.match(/HP\s*:\s*(\d+)\/(\d+)/i)
        if (hpM) { player.hp = +hpM[1]; player.maxHp = +hpM[2] }
        const mpM = block.match(/MP\s*:\s*(\d+)\/(\d+)/i)
        if (mpM) { player.mp = +mpM[1]; player.maxMp = +mpM[2] }
        const lvM = block.match(/LV\s*:\s*(\d+)/i)
        if (lvM) player.level = +lvM[1]
      }

      // <exits>...</exits>
      const exitsMatch = text.match(/<exits>([\s\S]*?)<\/exits>/)
      if (exitsMatch) {
        const exits = exitsMatch[1].split('\n').map(l => l.trim()).filter(l => l)
        // 渲染为选项
      }

      // <options>...</options>
      const optsMatch = text.match(/<options>([\s\S]*?)<\/options>/)
      if (optsMatch) {
        const opts: Option[] = []
        optsMatch[1].split('\n').forEach(line => {
          const m = line.match(/^\d+\.\s*(.*?)(?:\[([^\]]+)\])?\s*$/)
          if (m) {
            opts.push({ label: m[1].trim(), command: m[1].trim(), requirement: m[2] || undefined })
          }
        })
        currentOptions.value = opts
      }

      // 变量指令 $$ MOD('path', delta) $$
      const modRegex = /\$\$\s*MOD\s*\(\s*'([^']+)'\s*,\s*(-?\d+)\s*\)\s*\$\$/g
      let modMatch: RegExpExecArray | null
      while ((modMatch = modRegex.exec(text)) !== null) {
        const path = modMatch[1].toLowerCase()
        const delta = +modMatch[2]
        if (path.includes('hp')) player.hp = Math.max(0, Math.min(player.maxHp, player.hp + delta))
        if (path.includes('mp')) player.mp = Math.max(0, Math.min(player.maxMp, player.mp + delta))
        if (path.includes('exp') || path.includes('经验')) {
          player.exp += delta
          while (player.exp >= player.expToNext) {
            player.exp -= player.expToNext
            player.level++
            player.expToNext = Math.floor(player.expToNext * 1.5)
            player.maxHp += 10
            player.maxMp += 5
            player.hp = player.maxHp
            player.mp = player.maxMp
            addNarrative(`🎉 升级！你现在是 Lv.${player.level}`, 'system')
          }
        }
      }

      // 提取纯叙事文本（非标签部分）
      const cleanText = text.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '').replace(/\$\$[\s\S]*?\$\$/g, '').trim()
      if (cleanText) {
        addNarrative(cleanText)
      }
    }

    // === 初始化 ===
    onMounted(() => {
      loadGame()
      addNarrative('🌿 欢迎来到莫恩瑟利亚。', 'system')
      addNarrative('你站在起始之森的入口，晨光透过树冠洒下斑驳的光影。')
      addNarrative('空气中传来泥土与青草的气息，远处隐约可闻溪水声。')
      currentOptions.value = [
        { label: '深入森林探索', command: '深入森林探索' },
        { label: '沿着溪流走', command: '沿着溪流走' },
        { label: '检查背包', command: '检查背包' },
      ]

      // 监听酒馆消息更新
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'tavern_reply' && event.data?.text) {
          parseAITags(event.data.text)
        }
      })

      // 如果在 iframe 中，通知父窗口就绪
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'mornsaelia_ready' }, '*')
      }

      // 从 URL 参数解析初始状态
      const params = new URLSearchParams(window.location.search)
      if (params.has('state')) {
        try {
          const state = JSON.parse(decodeURIComponent(params.get('state')!))
          if (state.player) Object.assign(player, state.player)
          if (state.location) world.currentLocation = state.location
        } catch { /* ignore */ }
      }
    })

    return {
      themeVars, player, world, gameTime,
      chatInput, narrativeLog, currentOptions, showLog, narrativeRef,
      statNames, equipNames, expPercent, statusText, itemIcon,
      saveGame, toggleLog, scrollNarrative, selectOption, sendMessage, useItem, addNarrative,
    }
  },
})
</script>

<style>
/* === 全局样式 === */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; }

body {
  font-family: 'Segoe UI', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg, #1a0f0a);
  color: var(--text, #e8dcc8);
}

.mornsaelia-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  background: linear-gradient(135deg, var(--bg) 0%, #0d0805 100%);
}

/* === HUD === */
.hud {
  background: linear-gradient(180deg, var(--secondary, #2c1810) 0%, #1a0f0a 100%);
  border-bottom: 1px solid var(--border, #4a3a2a);
  padding: 8px 16px;
  flex-shrink: 0;
}
.hud-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
}
.hud-item i { margin-right: 4px; color: var(--primary, #c9a84c); }
.exp-bar {
  margin-top: 6px;
  height: 16px;
  background: #3a2a1a;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}
.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a84c, #e8c84c);
  border-radius: 8px;
  transition: width 0.5s;
}
.exp-text {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

/* === 三栏主面板 === */
.main-panel {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1px;
  background: var(--border, #4a3a2a);
}

.panel-left, .panel-right {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
}
.panel-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
  min-width: 0;
}

.panel-box {
  background: var(--bg-panel, #2a1a10);
  padding: 12px;
  overflow-y: auto;
}
.panel-box h3 {
  font-size: 12px;
  color: var(--primary);
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 4px;
}
.panel-box h3 i { margin-right: 4px; }

/* 左栏：属性 */
.stat-row, .equip-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 2px 0;
}
.stat-label, .equip-slot { color: var(--text-dim); }
.stat-value { color: var(--text); font-weight: bold; }
.equip-item { color: var(--primary); }

/* 中栏：叙事 */
.narrative-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.narrative-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 4px;
}
.location-tag {
  font-size: 11px;
  color: var(--primary);
  background: rgba(201,168,76,0.1);
  padding: 2px 8px;
  border-radius: 4px;
}
.narrative-actions { display: flex; gap: 4px; }
.btn-icon {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 2px 6px;
  font-size: 14px;
}
.btn-icon:hover { color: var(--primary); }

.narrative-content {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}
.narrative-line {
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 6px;
}
.narrative-line.system { color: var(--primary); font-style: italic; }
.sys-tag { opacity: 0.6; margin-right: 4px; }

/* 选项 */
.options-box { flex-shrink: 0; max-height: 200px; }
.option-btn {
  display: block;
  width: 100%;
  text-align: left;
  background: rgba(201,168,76,0.08);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 10px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.option-btn:hover {
  background: rgba(201,168,76,0.2);
  border-color: var(--primary);
}
.option-num {
  display: inline-block;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  background: var(--primary);
  color: var(--bg);
  border-radius: 50%;
  font-size: 11px;
  font-weight: bold;
  margin-right: 8px;
}
.option-req { color: var(--text-dim); font-size: 11px; margin-left: 6px; }

/* 右栏 */
.item-row, .quest-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 3px 0;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.15s;
}
.item-row:hover { background: rgba(201,168,76,0.1); }
.item-icon { font-size: 14px; }
.item-name { flex: 1; }
.item-qty { color: var(--text-dim); font-size: 11px; }
.empty-hint { color: var(--text-dim); font-size: 12px; font-style: italic; padding: 4px 0; }

.quest-status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
}
.quest-status.active { background: rgba(201,168,76,0.2); color: #e8c84c; }
.quest-status.completed { background: rgba(76,200,76,0.2); color: #4c8; }
.quest-status.failed { background: rgba(200,76,76,0.2); color: #c44; }

/* === 输入栏 === */
.input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--secondary);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.chat-input {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}
.chat-input:focus { border-color: var(--primary); }
.chat-input::placeholder { color: var(--text-dim); }

.send-btn, .save-btn {
  background: var(--primary);
  border: none;
  color: var(--bg);
  width: 36px; height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.15s;
}
.send-btn:hover, .save-btn:hover { transform: scale(1.1); }
.save-btn { background: var(--text-dim); }

/* === 日志弹窗 === */
.log-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.log-panel {
  background: var(--bg-panel);
  border: 1px solid var(--primary);
  border-radius: 8px;
  padding: 24px;
  width: 80%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;
}
.log-panel h2 { color: var(--primary); margin-bottom: 12px; }
.log-content {
  flex: 1;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.7;
}
.log-line { margin-bottom: 4px; }
.close-btn {
  position: absolute;
  top: 8px; right: 12px;
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 18px;
  cursor: pointer;
}
.close-btn:hover { color: var(--accent); }

/* === 滚动条 === */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }
</style>
