<template>
  <!-- 启动画面 -->
  <div v-if="!gameStarted" id="sp">
    <h1>莫恩瑟利亚</h1>
    <p>— 开放世界 RPG —</p>
    <div class="sp-btns">
      <button @click="startNew">新的旅程</button>
      <button class="s" @click="loadGame">继续冒险</button>
    </div>
  </div>

  <!-- 主面板 -->
  <div v-else id="pn" class="active">
    <!-- 左栏 -->
    <div class="left">
      <div class="bx">
        <h4>✦ 角色</h4>
        <div class="pl">Lv.{{ player.level }} · {{ player.name }}</div>
        <div class="sr"><span>HP</span><span class="v">{{ player.hp }}/{{ player.maxHp }}</span></div>
        <div class="bar"><div class="fl hp" :style="{ width: hpPct + '%' }"></div></div>
        <div class="sr"><span>MP</span><span class="v">{{ player.mp }}/{{ player.maxMp }}</span></div>
        <div class="bar"><div class="fl mp" :style="{ width: mpPct + '%' }"></div></div>
        <div class="sr"><span>EXP</span><span class="v">{{ player.exp }}/{{ player.expNext }}</span></div>
        <div class="bar"><div class="fl exp" :style="{ width: expPct + '%' }"></div></div>
      </div>
      <div class="bx">
        <h4>✦ 属性</h4>
        <div class="sg">
          <div v-for="(v,k) in player.stats" :key="k" class="sc">
            <span class="k">{{ k.toUpperCase() }}</span>
            <span class="v">{{ v }}</span>
          </div>
        </div>
      </div>
      <div class="bx" style="flex:1">
        <h4>✦ 位置</h4>
        <div class="ln">{{ currentLoc?.name }}</div>
        <div class="ld">{{ currentLoc?.desc }}</div>
      </div>
    </div>

    <!-- 中栏 -->
    <div class="center">
      <div class="hd">
        <span class="t">{{ currentLoc?.name }}</span>
        <span class="tm">第{{ gameTime.day }}日 {{ padTime(gameTime.hour) }}:00</span>
      </div>
      <div class="lg" ref="logRef">
        <div v-for="(msg,i) in log" :key="i" :class="['ms', msg.type === 's' ? 's' : '']">
          <div v-if="msg.type !== 'p'" class="h">第{{ msg.time.d }}日 {{ padTime(msg.time.h) }}:00</div>
          <div>{{ msg.text }}</div>
        </div>
      </div>
      <div class="ax">
        <button v-for="(opt,i) in options" :key="i" class="ab" @click="selectOption(opt)">
          ➡ {{ opt }}
        </button>
      </div>
    </div>

    <!-- 右栏 -->
    <div class="right">
      <div class="bx">
        <h4>✦ 装备</h4>
        <div class="es"><span class="l">武器</span><span :class="eq.weapon ? 'i' : 'e'">{{ eq.weapon || '空' }}</span></div>
        <div class="es"><span class="l">防具</span><span :class="eq.armor ? 'i' : 'e'">{{ eq.armor || '空' }}</span></div>
        <div class="es"><span class="l">饰品</span><span :class="eq.accessory ? 'i' : 'e'">{{ eq.accessory || '空' }}</span></div>
      </div>
      <div class="bx" style="flex:1">
        <h4>✦ 背包</h4>
        <div class="iv">
          <div v-for="i in 12" :key="i" class="ic" :class="{ has: inventory.length >= i }">
            {{ inventory[i-1] ? (inventory[i-1].icon || '📦') : '' }}
          </div>
        </div>
      </div>
      <button class="bn" @click="saveGame">💾 存档</button>
      <button class="bn" @click="loadGame">📂 读档</button>
      <button class="bn" @click="closeGame" style="border-color:#8b0000;color:#e57373">✕ 关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';

// === 地图数据 ===
const MAP = [
  { id: '起始之村', name: '起始之村', desc: '宁静的小村庄，麦田环绕。', exits: [{ t: '迷雾森林', m: '北面小路' }, { t: '风铃镇', m: '东面商道' }], safe: true },
  { id: '迷雾森林', name: '迷雾森林', desc: '浓雾终年的古老森林。', exits: [{ t: '起始之村', m: '南面回村' }, { t: '矿洞遗址', m: '西面洞口' }, { t: '风铃镇', m: '东面捷径' }] },
  { id: '风铃镇', name: '风铃镇', desc: '热闹的贸易小镇。', exits: [{ t: '起始之村', m: '西面大道' }, { t: '迷雾森林', m: '西面森林' }, { t: '王都', m: '北面大道' }, { t: '古城废墟', m: '东面旧道' }], safe: true },
  { id: '矿洞遗址', name: '矿洞遗址', desc: '废弃多年的矿洞。', exits: [{ t: '迷雾森林', m: '洞口外' }] },
  { id: '王都', name: '王都', desc: '王国中心，城堡高耸。', exits: [{ t: '风铃镇', m: '南面大道' }], safe: true },
  { id: '古城废墟', name: '古城废墟', desc: '古文明遗迹。', exits: [{ t: '风铃镇', m: '西面旧道' }, { t: '龙脊山', m: '北面山路' }] },
  { id: '龙脊山', name: '龙脊山', desc: '形如龙脊的山脉。', exits: [{ t: '古城废墟', m: '下山' }] },
];
const findLoc = (id: string) => MAP.find(l => l.id === id);

// === 状态 ===
const gameStarted = ref(false);
const log = ref<{ text: string; type: string; time: { d: number; h: number } }[]>([]);
const options = ref<string[]>([]);
const logRef = ref<HTMLElement | null>(null);

const player = ref({
  name: '旅人', level: 1, exp: 0, expNext: 100,
  hp: 100, maxHp: 100, mp: 50, maxMp: 50, gold: 0,
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
});
const currentLoc = ref('起始之村');
const inventory = ref<any[]>([]);
const eq = ref({ weapon: null, armor: null, accessory: null });
const gameTime = ref({ d: 1, h: 8 });
const visited = ref<string[]>(['起始之村']);

const loc = computed(() => findLoc(currentLoc.value));
const currentLocName = computed(() => currentLoc.value);
const hpPct = computed(() => (player.value.hp / player.value.maxHp) * 100);
const mpPct = computed(() => (player.value.mp / player.value.maxMp) * 100);
const expPct = computed(() => (player.value.exp / player.value.expNext) * 100);

function padTime(h: number) { return String(h).padStart(2, '0'); }

// === 方法 ===
function addLog(text: string, type: string = 'n') {
  log.value.push({ text, type, time: { ...gameTime.value } });
  nextTick(() => { if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight; });
}

function refreshOptions() {
  const l = loc.value;
  if (!l) return;
  options.value = l.exits.map(e => e.t + ' (' + e.m + ')');
}

function startNew() {
  gameStarted.value = true;
  const l = loc.value;
  if (l) addLog('踏入 ' + l.name + '。' + l.desc, 's');
  refreshOptions();
}

function loadGame() {
  try {
    const d = localStorage.getItem('mns_save');
    if (!d) { startNew(); return; }
    const s = JSON.parse(d);
    player.value = s.player;
    currentLoc.value = s.loc;
    inventory.value = s.inv || [];
    eq.value = s.eq || { weapon: null, armor: null, accessory: null };
    gameTime.value = s.time;
    visited.value = s.visited;
    log.value = s.log || [];
    gameStarted.value = true;
    refreshOptions();
    addLog('📂 已读取存档', 's');
  } catch { startNew(); }
}

function saveGame() {
  localStorage.setItem('mns_save', JSON.stringify({
    player: player.value, loc: currentLoc.value, inv: inventory.value,
    eq: eq.value, time: gameTime.value, visited: visited.value, log: log.value
  }));
  addLog('💾 已保存', 's');
}

function closeGame() {
  window.close();
}

function selectOption(opt: string) {
  // 检查是否是移动指令
  for (const l of MAP) {
    if (opt.includes(l.id) || opt.includes(l.name)) {
      moveTo(l.id);
      return;
    }
  }
  addLog('▶ ' + opt, 'p');
  options.value = [];
}

function moveTo(id: string) {
  currentLoc.value = id;
  if (!visited.value.includes(id)) visited.value.push(id);
  gameTime.value.h += 2;
  if (gameTime.value.h >= 24) { gameTime.value.h -= 24; gameTime.value.d++; }
  const l = findLoc(id);
  if (l) addLog('—— 前往 ' + l.name + ' ——\n' + l.desc, 's');
  refreshOptions();
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body, html { height: 100%; width: 100%; overflow: hidden; }
body {
  background: #0d0a08; color: #f0e6d2;
  font-family: 'Georgia', 'Noto Serif SC', serif;
}

/* 启动画面 */
#sp {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  background: radial-gradient(ellipse at center, #1a1410, #0d0a08);
  z-index: 2000;
}
#sp h1 { font-size: 3em; color: #c9a84c; margin-bottom: 8px; }
#sp p { color: #a09080; font-style: italic; margin-bottom: 30px; }
.sp-btns button {
  padding: 12px 32px; font-size: 1em; border: 2px solid #8c7853;
  background: transparent; color: #c9a84c; border-radius: 4px; cursor: pointer; margin: 0 8px;
}
.sp-btns button:hover { background: #c9a84c; color: #0d0a08; }
.sp-btns button.s { border-color: #5a4e3c; color: #a09080; }

/* 主面板 */
#pn { display: flex; width: 100%; height: 100vh; }

.left {
  width: 240px; min-width: 240px; background: #1a1410;
  border-right: 1px solid #241e18; padding: 12px;
  display: flex; flex-direction: column; gap: 8px; overflow-y: auto;
}
.bx { background: #241e18; border: 1px solid #5a4e3c; border-radius: 5px; padding: 10px; }
.bx h4 { font-size: .7em; color: #c9a84c; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 6px; }
.pl { font-size: .85em; color: #c9a84c; margin-bottom: 4px; }
.sr { display: flex; justify-content: space-between; font-size: .75em; margin-bottom: 3px; color: #a09080; }
.sr .v { color: #f0e6d2; }
.bar { height: 6px; background: #0d0a08; border-radius: 3px; overflow: hidden; border: 1px solid #5a4e3c; margin-bottom: 4px; }
.fl { height: 100%; transition: width .5s; }
.fl.hp { background: #e57373; }
.fl.mp { background: #64b5f6; }
.fl.exp { background: #ffd54f; }
.sg { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
.sc { font-size: .7em; background: #0d0a08; padding: 2px 5px; border-radius: 2px; display: flex; justify-content: space-between; }
.sc .k { color: #a09080; }
.sc .v { color: #c9a84c; font-weight: bold; }
.ln { font-size: .8em; color: #c9a84c; }
.ld { font-size: .68em; color: #a09080; font-style: italic; }

.center { flex: 1; display: flex; flex-direction: column; background: #0d0a08; min-width: 0; }
.hd { padding: 8px 14px; border-bottom: 1px solid #241e18; display: flex; justify-content: space-between; font-size: .8em; flex-shrink: 0; }
.hd .t { color: #c9a84c; }
.hd .tm { color: #605548; }
.lg { flex: 1; overflow-y: auto; padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; }
.ms { padding: 7px 10px; background: #241e18; border: 1px solid #5a4e3c; border-radius: 4px; font-size: .8em; line-height: 1.5; }
.ms.s { border-left: 3px solid #c9a84c; font-style: italic; color: #a09080; font-size: .74em; }
.ms .h { font-size: .65em; color: #605548; margin-bottom: 2px; }
.ax { padding: 8px 14px; border-top: 1px solid #241e18; display: flex; flex-direction: column; gap: 4px; max-height: 160px; overflow-y: auto; flex-shrink: 0; }
.ab { padding: 6px 10px; background: #241e18; border: 1px solid #5a4e3c; color: #f0e6d2; font-size: .76em; border-radius: 3px; cursor: pointer; text-align: left; }
.ab:hover { background: #8c7853; color: #0d0a08; }

.right {
  width: 220px; min-width: 220px; background: #1a1410;
  border-left: 1px solid #241e18; padding: 12px;
  display: flex; flex-direction: column; gap: 8px; overflow-y: auto;
}
.es { display: flex; gap: 6px; padding: 4px 7px; background: #0d0a08; border: 1px solid #5a4e3c; border-radius: 3px; font-size: .7em; }
.es .l { color: #605548; min-width: 35px; }
.es .i { color: #f0e6d2; }
.es .e { color: #605548; font-style: italic; }
.iv { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; }
.ic { aspect-ratio: 1; background: #0d0a08; border: 1px solid #5a4e3c; border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: .6em; }
.ic.has { border-color: #8c7853; color: #f0e6d2; }
.bn { padding: 6px; background: #241e18; border: 1px solid #5a4e3c; color: #a09080; font-size: .72em; border-radius: 3px; cursor: pointer; text-align: center; }
.bn:hover { background: #8c7853; color: #0d0a08; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0d0a08; }
::-webkit-scrollbar-thumb { background: #5a4e3c; border-radius: 2px; }
</style>
