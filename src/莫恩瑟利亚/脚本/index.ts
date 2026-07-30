/**
 * 莫恩瑟利亚 RPG 面板 — tavern_helper 脚本
 * 
 * 运行在酒馆主文档层级，不受消息楼层 CSS transform 影响
 * 创建固定定位的全屏 RPG 面板
 */

function main() {
  // 如果面板已存在就不重复创建
  if (document.getElementById('mornsaelia-panel')) return

  const panel = document.createElement('div')
  panel.id = 'mornsaelia-panel'
  Object.assign(panel.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '99999',
    background: 'rgba(13, 10, 8, 0.95)',
    color: '#e8dcc8',
    fontFamily: '"Segoe UI","Noto Sans SC",sans-serif',
    display: 'none',
    overflow: 'hidden',
  })

  panel.innerHTML = `
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--p:#c9a84c;--s:#2c1810;--a:#8b0000;--bg:#1a0f0a;--pl:#2a1a10;--tx:#e8dcc8;--dm:#8a7a6a;--br:#4a3a2a}
.m-panel{display:flex;flex-direction:column;height:100vh;background:linear-gradient(135deg,var(--bg) 0%,#0d0805 100%)}
.hud{background:linear-gradient(180deg,var(--s),var(--bg));border-bottom:1px solid var(--br);padding:8px 16px;flex-shrink:0}
.hud-row{display:flex;gap:16px;flex-wrap:wrap;font-size:13px}
.hud-item i{color:var(--p);margin-right:4px}
.exp-bar{height:14px;background:#3a2a1a;border-radius:7px;margin-top:6px;position:relative;overflow:hidden}
.exp-fill{height:100%;background:linear-gradient(90deg,var(--p),#e8c84c);border-radius:7px;transition:width .5s}
.exp-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;color:#fff;text-shadow:0 1px 2px #000}
.main{display:flex;flex:1;overflow:hidden;gap:1px;background:var(--br)}
.left,.right{width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:1px;background:var(--br)}
.center{flex:1;display:flex;flex-direction:column;gap:1px;background:var(--br);min-width:0}
.box{background:var(--pl);padding:12px;overflow-y:auto}
.box h3{font-size:11px;color:var(--p);Margin:0 0 8px;border-bottom:1px solid var(--br);padding-bottom:4px}
.box h3 i{margin-right:4px}
.sr,.er{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
.sl,.es{color:var(--dm)}.sv{color:var(--tx);font-weight:bold}.ei{color:var(--p)}
.narr{flex:1;display:flex;flex-direction:column;overflow:hidden}
.narr-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid var(--br);padding-bottom:4px}
.loc-tag{font-size:10px;color:var(--p);background:rgba(201,168,76,0.1);padding:2px 8px;border-radius:3px}
.narr-c{flex:1;overflow-y:auto}
.narr-l{font-size:13px;line-height:1.7;margin-bottom:6px}
.narr-l.s{color:var(--p);font-style:italic}
.opt-box{flex-shrink:0;max-height:180px}
.opt-btn{display:block;width:100%;text-align:left;background:rgba(201,168,76,0.08);border:1px solid var(--br);color:var(--tx);padding:5px 10px;margin:2px 0;border-radius:3px;cursor:pointer;font-size:12px;transition:all .15s}
.opt-btn:hover{background:rgba(201,168,76,0.2);border-color:var(--p)}
.opt-n{display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;background:var(--p);color:var(--bg);border-radius:50%;font-size:9px;font-weight:bold;margin-right:6px}
.item-r{display:flex;align-items:center;gap:6px;font-size:12px;padding:2px 0;cursor:pointer;border-radius:2px}
.item-r:hover{background:rgba(201,168,76,0.1)}
.empty{color:var(--dm);font-size:11px;font-style:italic}
.q-st{font-size:9px;padding:1px 5px;border-radius:2px}
.q-st.active{background:rgba(201,168,76,0.2);color:#e8c84c}
.q-st.done{background:rgba(76,200,76,0.2);color:#4c8}
.footer{display:flex;align-items:center;gap:8px;padding:8px 16px;background:var(--s);border-top:1px solid var(--br);flex-shrink:0}
.chat-inp{flex:1;background:var(--bg);border:1px solid var(--br);color:var(--tx);padding:8px 12px;border-radius:6px;font-size:13px;outline:none}
.chat-inp:focus{border-color:var(--p)}
.send-b{background:var(--p);border:none;color:var(--bg);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:14px}
.send-b:hover{transform:scale(1.1)}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-thumb{background:var(--br);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--p)}
</style>

<div class="m-panel">
  <div class="hud">
    <div class="hud-row">
      <span class="hud-item"><i class="fas fa-heart"></i> <span id="m-hp">100</span>/<span id="m-hpm">100</span></span>
      <span class="hud-item"><i class="fas fa-star"></i> <span id="m-mp">50</span>/<span id="m-mpm">50</span></span>
      <span class="hud-item"><i class="fas fa-level-up-alt"></i> Lv.<span id="m-lv">1</span></span>
      <span class="hud-item"><i class="fas fa-map-pin"></i> <span id="m-loc">起始之森</span></span>
      <span class="hud-item"><i class="fas fa-clock"></i> 第<span id="m-day">1</span>日 <span id="m-hr">08</span>:<span id="m-min">00</span></span>
    </div>
    <div class="exp-bar"><div class="exp-fill" id="m-expb" style="width:0%"></div><span class="exp-text">EXP <span id="m-exp">0</span>/<span id="m-expn">100</span></span></div>
  </div>

  <div class="main">
    <div class="left">
      <div class="box"><h3><i class="fas fa-crown"></i> 属性</h3><div id="m-stats"></div></div>
      <div class="box"><h3><i class="fas fa-shield-alt"></i> 装备</h3><div id="m-equip"></div></div>
    </div>

    <div class="center">
      <div class="box narr">
        <div class="narr-h"><span class="loc-tag" id="m-loctag">起始之森</span></div>
        <div class="narr-c" id="m-narr"><p class="narr-l">🌿 欢迎来到莫恩瑟利亚。</p><p class="narr-l">你站在起始之森的入口，晨光透过树冠洒下斑驳光影。</p></div>
      </div>
      <div class="box opt-box" id="m-optbox" style="display:none">
        <h3><i class="fas fa-list"></i> 行动</h3><div id="m-opts"></div>
      </div>
    </div>

    <div class="right">
      <div class="box"><h3><i class="fas fa-shopping-bag"></i> 背包</h3><div id="m-inv"><div class="empty">空空如也</div></div></div>
      <div class="box"><h3><i class="fas fa-tasks"></i> 任务</h3><div id="m-quest"><div class="empty">无活跃任务</div></div></div>
    </div>
  </div>

  <div class="footer">
    <input type="text" id="m-input" class="chat-inp" placeholder="输入你的行动…">
    <button class="send-b" id="m-send"><i class="fas fa-paper-plane"></i></button>
  </div>
</div>
  `

  document.body.appendChild(panel)

  // 状态管理
  const state = {
    hp: 100, hpm: 100, mp: 50, mpm: 50, lv: 1,
    exp: 0, expn: 100, loc: '起始之森',
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    equip: { weapon: null, armor: null, accessory: null },
  }

  // 解析 AI 回复
  function parseMessage(text) {
    // <status>
    const sm = text.match(/<status>([\s\S]*?)<\/status>/)
    if (sm) {
      const b = sm[1]
      const hp = b.match(/HP\s*:\s*(\d+)\/(\d+)/i)
      if (hp) { state.hp = +hp[1]; state.hpm = +hp[2] }
      const mp = b.match(/MP\s*:\s*(\d+)\/(\d+)/i)
      if (mp) { state.mp = +mp[1]; state.mpm = +mp[2] }
      const lv = b.match(/LV\s*:\s*(\d+)/i)
      if (lv) state.lv = +lv[1]
      const ex = b.match(/EXP\s*:\s*(\d+)\/(\d+)/i)
      if (ex) { state.exp = +ex[1]; state.expn = +ex[2] }
      const loc = b.match(/位置\s*:\s*(.+)/)
      if (loc) state.loc = loc[1].trim()
      updateHUD()
    }

    // <options>
    const om = text.match(/<options>([\s\S]*?)<\/options>/)
    const ob = document.getElementById('m-optbox')
    const od = document.getElementById('m-opts')
    if (om) {
      ob.style.display = 'block'
      od.innerHTML = ''
      om[1].split('\n').forEach(line => {
        const m = line.match(/^\d+\.\s*(.*?)(?:\[([^\]]+)\])?\s*$/)
        if (m) {
          const btn = document.createElement('button')
          btn.className = 'opt-btn'
          btn.innerHTML = '<span class="opt-n">' + (od.children.length + 1) + '</span>' + m[1].trim()
          if (m[2]) btn.innerHTML += '<span style="color:var(--dm);font-size:10px;margin-left:4px">[' + m[2] + ']</span>'
          btn.onclick = () => sendMsg(m[1].trim())
          od.appendChild(btn)
        }
      })
    } else {
      ob.style.display = 'none'
    }

    // 纯文本追加到叙事
    const clean = text.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '').replace(/\$\$[\s\S]*?\$\$/g, '').trim()
    if (clean) addNarrative(clean)
  }

  function updateHUD() {
    document.getElementById('m-hp').textContent = state.hp
    document.getElementById('m-hpm').textContent = state.hpm
    document.getElementById('m-mp').textContent = state.mp
    document.getElementById('m-mpm').textContent = state.mpm
    document.getElementById('m-lv').textContent = state.lv
    document.getElementById('m-exp').textContent = state.exp
    document.getElementById('m-expn').textContent = state.expn
    document.getElementById('m-loc').textContent = state.loc
    document.getElementById('m-loctag').textContent = state.loc
    document.getElementById('m-expb').style.width = Math.min(100, (state.exp / state.expn) * 100) + '%'
  }

  function addNarrative(text) {
    const nc = document.getElementById('m-narr')
    const p = document.createElement('p')
    p.className = 'narr-l'
    p.textContent = text
    nc.appendChild(p)
    nc.scrollTop = nc.scrollHeight
  }

  function sendMsg(text) {
    if (!text) return
    addNarrative('> ' + text)
    // 注入酒馆输入框
    const ta = document.querySelector('#send_textarea, textarea.message, .mes_textarea')
    if (ta) {
      ta.value = text
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      const sb = document.querySelector('#send_but, .send_but, button[title="发送"]')
      if (sb) sb.click()
    }
  }

  // 监听消息变化
  let lastText = ''
  function pollMessages() {
    const mes = document.querySelectorAll('.mes')
    if (mes.length) {
      const last = mes[mes.length - 1]
      const t = last?.textContent?.trim() || ''
      if (t && t !== lastText && t !== '...' && t.length > 10) {
        lastText = t
        parseMessage(t)
      }
    }
  }

  // 输入框回车发送
  document.getElementById('m-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const inp = document.getElementById('m-input')
      sendMsg(inp.value)
      inp.value = ''
    }
  })
  document.getElementById('m-send').addEventListener('click', () => {
    const inp = document.getElementById('m-input')
    sendMsg(inp.value)
    inp.value = ''
  })

  setInterval(pollMessages, 1000)
}

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}
