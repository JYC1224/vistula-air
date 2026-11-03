import { AIRCRAFT, AIRCRAFT_BY_ID } from '../data/aircraft.js';
import { AIRPORTS, MISSIONS, SERVICES } from '../data/airports.js';
import { availableMission, distanceKm, forecast, missionProgress, validatePlan } from '../systems/simulation.js';
import { asset, escape as e, gameDate, integer, money, percent } from '../utils/format.js';
import { icon, logo } from './icons.js';

const STAFF = {
  marta: { name: 'Marta', role: '營運總監', image: 'marta' },
  tomasz: { name: 'Tomasz', role: '機務主管', image: 'tomasz' },
  anna: { name: 'Anna', role: '機隊顧問', image: 'anna' },
};
const NAV = [
  ['operations', 'overview', '營運總覽', '01'], ['routes', 'route', '航線調度', '02'],
  ['fleet', 'fleet', '機隊機庫', '03'], ['aircraft', 'book', '機型資料庫', '04'], ['missions', 'task', '董事會委託', '05'],
];
const status = (plane, state) => plane.maintenance ? `保養中 · ${plane.maintenance} 天` : plane.health < 45 ? '待保養 · 暫停派飛' : state.routes.some((route) => route.active && route.aircraftId === plane.id) ? '執飛中' : '待命';
const photo = (id, className = '') => `<img class="aircraft-photo ${className}" src="${asset(`images/aircraft/${id}.jpg`)}" alt="${e(AIRCRAFT_BY_ID[id]?.name)} 實機參考照片" loading="lazy" />`;
const avatar = (person = 'marta') => `<img class="avatar" src="${asset(`images/ui/${STAFF[person].image}.svg`)}" alt="${STAFF[person].name}" />`;
const bar = (value, className = '') => `<span class="progress-track ${className}"><span style="width:${Math.max(0, Math.min(100, value * 100))}%"></span></span>`;

export class GameUI {
  constructor(store) {
    this.store = store;
    this.modal = null;
    this.turnBusy = false;
    this.credits = [];
    this.audio = {};
    this.toastTimer = null;
    fetch(asset('data/credits.json')).then((response) => response.json()).then((credits) => { this.credits = credits; }).catch(() => {});
  }

  mount(root) {
    this.root = root;
    root.innerHTML = `
      <aside class="sidebar">
        <a class="brand" href="./" aria-label="Vistula Air 營運中心"><span class="brand-mark">${logo}</span><span>VISTULA<span class="brand-air">AIR</span><small>航空經營誌</small></span></a>
        <div class="workspace-label">YOUR WORKSPACE <span>WAW</span></div>
        <nav class="navigation" aria-label="遊戲工作區">${NAV.map(([id, glyph, label, key]) => `<button type="button" data-action="nav" data-id="${id}" class="nav-item" title="${key} · ${label}">${icon(glyph)}<span>${label}</span><small>${key}</small></button>`).join('')}</nav>
        <div class="sidebar-footer"><div class="base-station"><span class="base-dot"></span><div><b>WARSAW CHOPIN</b><small>華沙基地 · WAW / EPWA</small></div></div><button class="sidebar-link" data-action="guide">${icon('info')}<span>工作手冊</span></button><button class="sidebar-link" data-action="settings">${icon('settings')}<span>設定與資料來源</span></button><div class="save-state" id="save-state"></div></div>
      </aside>
      <div class="workspace">
        <header class="topbar"><div class="topbar-location"><span class="live-dot"></span> 華沙營運中心 <span class="topbar-divider">/</span> <span id="workspace-name">營運總覽</span></div><div class="topbar-right"><button class="icon-button" data-action="sound" id="sound-button" aria-label="開啟音效"></button><button class="inbox-button" data-action="inbox" aria-label="員工訊息">${icon('people')}<span>團隊訊息</span><i></i></button><span class="ceo-avatar">CEO</span></div></header>
        <main class="main-content">
          <div class="page-heading"><div><div class="eyebrow">VISTULA AIR · OPERATIONS DESK</div><h1 id="page-title">每條航線，都從一個決定開始。</h1><p id="page-subtitle">你的機隊，你的判斷。從華沙連結更大的世界。</p></div><div class="day-actions"><div class="game-date"><span id="game-date"></span><b id="game-day"></b></div><button class="primary-button advance-button" data-action="advance">下一營運日 ${icon('arrow')}</button></div></div>
          <div class="metrics" id="metrics"></div>
          <section class="game-view" id="view-operations">
            <div class="operations-grid"><article class="map-card"><div class="card-heading"><div><h2>${icon('globe')} 航線網路</h2><span>以 WAW 為起點，規劃你的下一站</span></div><div class="map-switch"><button data-action="map" data-id="europe" class="active">歐洲</button><button data-action="map" data-id="world">跨洲</button></div></div><div class="map-surface"><div id="route-map" role="img" aria-label="可點選機場的航線地圖；也可使用下方機場按鈕選擇"></div><div class="map-top-label"><span class="live-dot"></span> WAW HUB <span>52.17° N / 20.97° E</span></div><div class="map-legend"><span><i class="legend-dot amber"></i>規劃航線</span><span><i class="legend-dot mint"></i>營運航線</span><span><i class="legend-dot"></i>潛在市場</span></div><div class="map-compass">N<span>↑</span></div></div><div class="airport-strip" id="airport-strip"></div></article><aside class="mission-panel" id="mission-panel"></aside></div>
            <div class="section-heading"><div><h2>今天的機隊</h2><span id="fleet-summary"></span></div><button class="text-button" data-action="nav" data-id="fleet">前往機隊機庫 ${icon('arrow')}</button></div><div class="fleet-strip" id="fleet-strip"></div>
            <div class="desk-note" id="desk-note"></div>
          </section>
          <section class="game-view" id="view-routes" hidden></section>
          <section class="game-view" id="view-fleet" hidden></section>
          <section class="game-view" id="view-aircraft" hidden></section>
          <section class="game-view" id="view-missions" hidden></section>
          <footer class="workspace-bottom"><span>VISTULA AIR · 華沙營運席位</span><button data-action="report">${icon('chart')} 最近營運報告</button><span>營運需求與成本為遊戲模擬值</span></footer>
        </main>
      </div>`;
    this.modalRoot = document.getElementById('modal-root');
    this.toastRoot = document.getElementById('toast-root');
    this.onClick = this.handleClick.bind(this);
    root.addEventListener('click', this.onClick);
    this.modalRoot.addEventListener('click', this.onClick);
    this.modalRoot.addEventListener('change', () => { if (this.modal === 'planner') this.updateForecast(); });
    this.onKey = this.handleKey.bind(this);
    document.addEventListener('keydown', this.onKey);
    this.unsubscribe = this.store.subscribe(() => this.render());
    this.render();
  }

  render() {
    const { state, ui } = this.store;
    const activeRoutes = state.routes.filter((route) => route.active);
    const label = NAV.find(([id]) => id === ui.view)?.[2] || '營運總覽';
    this.root.querySelectorAll('.nav-item').forEach((button) => { button.classList.toggle('active', button.dataset.id === ui.view); button.setAttribute('aria-current', button.dataset.id === ui.view ? 'page' : 'false'); });
    this.root.querySelectorAll('.game-view').forEach((view) => { view.hidden = view.id !== `view-${ui.view}`; });
    this.root.querySelectorAll('[data-action="map"]').forEach((button) => button.classList.toggle('active', button.dataset.id === ui.mapMode));
    this.root.querySelector('#workspace-name').textContent = label;
    this.root.querySelector('#page-title').textContent = ({ operations: '每條航線，都從一個決定開始。', routes: '把每一架飛機，放在對的航線。', fleet: '好的營運，從了解機隊開始。', aircraft: '認識輪廓，也讀懂差異。', missions: '下一站，讓公司走得更遠。' })[ui.view];
    this.root.querySelector('#page-subtitle').textContent = ({ operations: '你的機隊，你的判斷。從華沙連結更大的世界。', routes: '比較需求、運能與成本，讓每個往返都值得。', fleet: '購租、調度與保養。每個決定都會影響可用運能。', aircraft: '真實機型照片、世代與引擎。為下一個任務找到合適的選擇。', missions: '以一份份工作委託，寫下航空公司的成長紀錄。' })[ui.view];
    this.root.querySelector('#game-date').textContent = gameDate(state.day);
    this.root.querySelector('#game-day').textContent = `DAY ${String(state.day).padStart(2, '0')}`;
    this.root.querySelector('.advance-button').disabled = this.turnBusy;
    this.root.querySelector('#sound-button').innerHTML = icon(state.sound ? 'sound' : 'mute');
    this.root.querySelector('#sound-button').setAttribute('aria-label', state.sound ? '關閉音效' : '開啟音效');
    this.root.querySelector('#save-state').innerHTML = `${icon(!this.store.saved ? 'info' : 'check')} ${this.store.saved ? '進度自動儲存於此裝置' : '無法寫入本機存檔'}`;
    const lastProfit = state.report?.profit;
    this.root.querySelector('#metrics').innerHTML = [
      ['可用資金', money(state.cash), 'wallet', lastProfit == null ? '董事會起始營運資金' : `昨日淨利 ${money(lastProfit)}`, lastProfit >= 0 ? 'positive' : ''],
      ['營運航線', `${String(activeRoutes.length).padStart(2, '0')}<small> 條</small>`, 'route', `${state.fleet.length} 架飛機 · ${state.fleet.filter((plane) => !plane.maintenance && plane.health >= 45 && !activeRoutes.some((route) => route.aircraftId === plane.id)).length} 架待命`, ''],
      ['累積服務旅客', integer(state.passengers), 'people', state.passengers ? '每一次起降，都是一次連結' : '新旅程，即將開始', ''],
      ['公司聲望', `${state.reputation}<small> / 100</small>`, 'star', `${state.completed.length} / 6 份董事會委託已完成`, ''],
    ].map(([title, value, glyph, sub, color]) => `<div class="metric"><span class="metric-label">${title}${icon(glyph)}</span><b>${value}</b><small class="${color}">${sub}</small></div>`).join('');
    this.root.querySelector('#airport-strip').innerHTML = MISSIONS.map((mission) => `<button data-action="airport" data-id="${mission.destination}" class="airport-chip ${ui.selected === mission.destination ? 'selected' : ''} ${state.completed.length < mission.unlock ? 'is-locked' : ''}"><b>${mission.destination}</b><span>${AIRPORTS[mission.destination].city}</span>${state.completed.includes(mission.id) ? icon('check') : state.completed.length < mission.unlock ? icon('lock') : ''}</button>`).join('');
    this.renderMissionPanel();
    this.root.querySelector('#fleet-summary').textContent = `${state.fleet.length} 架機隊 · ${state.fleet.filter((plane) => plane.maintenance).length} 架保養中`;
    this.root.querySelector('#fleet-strip').innerHTML = state.fleet.slice(0, 3).map((plane) => this.fleetCard(plane, true)).join('');
    const message = state.messages[0];
    this.root.querySelector('#desk-note').innerHTML = `${avatar(message?.person || 'marta')}<div><b>${e(message?.title || '營運席位已就緒')}</b><p>${e(message?.text || '準備好後，就從一條新航線開始。')}</p></div><button class="text-button" data-action="inbox">查看訊息 ${icon('arrow')}</button>`;
    this.renderRoutes(); this.renderFleet(); this.renderAircraft(); this.renderMissions();
  }

  fleetCard(plane, compact = false) {
    const model = AIRCRAFT_BY_ID[plane.type];
    const route = this.store.state.routes.find((item) => item.active && item.aircraftId === plane.id);
    return `<article class="fleet-card ${compact ? 'compact' : ''}"><button class="photo-button" data-action="unit" data-id="${plane.id}">${photo(model.id)}<span class="aircraft-name-overlay"><b>${model.short}</b><span>${model.manufacturer}</span></span><span class="status-pill ${plane.maintenance ? 'warning' : route ? 'operating' : ''}">${status(plane, this.store.state)}</span></button><div class="fleet-card-body"><div class="fleet-card-top"><span class="registration">${plane.registration}</span><b>${route ? `WAW → ${route.destination}` : `${model.seats} 席`}</b></div><div class="condition-row"><span>維護指標</span><b class="${plane.health < 65 ? 'amber-text' : ''}">${Math.round(plane.health)}%</b></div>${bar(plane.health / 100, plane.health < 65 ? 'warning' : '')}${compact ? '' : `<div class="fleet-card-actions"><button class="secondary-button" data-action="unit" data-id="${plane.id}">${icon('wrench')} 機務管理</button><button class="text-button" data-action="model" data-id="${plane.type}">機型資料 ${icon('arrow')}</button></div>`}</div></article>`;
  }

  renderMissionPanel() {
    const { state, ui } = this.store;
    const mission = MISSIONS.find((item) => item.destination === ui.selected) || availableMission(state);
    if (!mission) return;
    const airport = AIRPORTS[mission.destination];
    const progress = missionProgress(state, mission);
    const completed = state.completed.includes(mission.id);
    const locked = mission.unlock > state.completed.length;
    const route = state.routes.find((item) => item.destination === mission.destination && item.active);
    this.root.querySelector('#mission-panel').innerHTML = `<div class="mission-kicker"><span class="mission-label">${completed ? `${icon('check')} 已完成委託` : locked ? `${icon('lock')} 後續市場` : `${icon('task')} 航線委託`}</span><span>CHAPTER ${mission.chapter}</span></div><div class="route-heading"><span>WAW</span><span class="route-heading-line">${icon('plane')}</span><span>${airport.code}</span></div><div class="route-cities"><span>華沙</span><span>${airport.city}</span></div><h2>${mission.title}</h2><p class="mission-brief">${mission.brief}</p><div class="mission-facts"><div><span>航線距離</span><b>${integer(distanceKm(airport.code))}<small> km</small></b></div><div><span>每日雙向需求</span><b>${airport.demand}<small> 人</small></b></div></div><button class="primary-button full-width" data-action="plan" data-id="${airport.code}" ${locked ? 'disabled' : ''}>${locked ? '市場尚未解鎖' : route ? '調整航線方案' : '規劃這條航線'} ${icon(locked ? 'lock' : 'arrow')}</button><div class="mission-progress"><div><span>${completed ? '已達成營運目標' : '委託進度'}</span><b>${Math.round(progress.fraction * 100)}%</b></div>${bar(progress.fraction)}<p>${integer(progress.pax)} / ${integer(mission.pax)} 位旅客 <span>·</span> 至少 ${mission.days} 天 <span>·</span> 載客率 ${percent(mission.load)}</p></div><div class="staff-inline">${avatar('marta')}<div><b>Marta <span>營運總監</span></b><p>${locked ? `先完成 ${mission.unlock} 份委託，再帶領公司進入這個市場。` : route ? '方案已投入營運。準備好後推進一天，再檢查結果是否符合預期。' : '先看看需求，再決定用哪一架飛機。你可以慢慢比較。'}</p></div></div><div class="mission-reward">${icon('star')} 完成獎勵 <b>${money(mission.reward)}</b><span>＋7 聲望</span></div>`;
  }

  renderRoutes() {
    const { state } = this.store;
    const rows = state.routes.map((route) => {
      const plane = state.fleet.find((item) => item.id === route.aircraftId);
      const estimate = forecast(state, route.destination, plane.id, route.frequency, route.service);
      return `<tr><td><div class="table-route"><b>WAW <span>→</span> ${route.destination}</b><small>${AIRPORTS[route.destination].city} · ${integer(distanceKm(route.destination))} km</small></div></td><td><b>${estimate.model.short}</b><small>${plane.registration}</small></td><td>${route.frequency} 往返／日</td><td>${percent(estimate.load)}</td><td class="${estimate.profit >= 0 ? 'positive' : 'negative'}">${money(estimate.profit)}</td><td><span class="status-pill static ${route.active ? 'operating' : ''}">${route.active ? plane.maintenance ? '保養停場' : plane.health < 45 ? '待保養' : '營運中' : '已暫停'}</span></td><td><div class="table-actions"><button class="text-button" data-action="plan" data-id="${route.destination}">調整</button>${route.active ? `<button class="text-button muted" data-action="pause" data-id="${route.destination}">暫停</button>` : ''}</div></td></tr>`;
    }).join('');
    this.root.querySelector('#view-routes').innerHTML = `<div class="section-heading"><div><h2>航線調度台</h2><span>預估為每日營運值；公司另有固定管理費與未派飛機隊成本。</span></div><button class="primary-button" data-action="nav" data-id="operations">${icon('plus')} 規劃新航線</button></div><div class="table-wrap"><table><thead><tr><th>航線</th><th>執飛機型</th><th>班次</th><th>預估載客率</th><th>預估航線日利</th><th>狀態</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table></div><div class="info-note">${icon('info')} 一架飛機同時服務一條航線。暫停原航線後，即可將飛機派往其他目的地；已累積的委託進度會保留。</div>${this.historyPanel()}`;
  }

  renderFleet() {
    const { state, ui } = this.store;
    const owned = ui.fleetTab === 'owned';
    this.root.querySelector('#view-fleet').innerHTML = `<div class="section-heading"><div class="segmented"><button class="${owned ? 'active' : ''}" data-action="fleet-tab" data-id="owned">我的機隊 <span>${state.fleet.length}</span></button><button class="${!owned ? 'active' : ''}" data-action="fleet-tab" data-id="market">購租市場 <span>${AIRCRAFT.length}</span></button></div><button class="secondary-button" data-action="structure">${icon('info')} 飛機構造與原理</button></div>${owned ? `<div class="aircraft-grid">${state.fleet.map((plane) => this.fleetCard(plane)).join('')}</div><div class="info-note">${icon('wrench')} 維護指標低於 45 時暫停派飛。保養占用完整營運日，完成後於下一天恢復可用；請先考慮替代派機。</div>` : `<div class="staff-banner">${avatar('anna')}<div><b>Anna · 機隊顧問</b><p>先挑適合市場的飛機，再決定投入方式。租賃保留現金，購買減少後續日租金。</p></div></div><div class="aircraft-grid market-grid">${AIRCRAFT.map((model) => this.marketCard(model)).join('')}</div>`}`;
  }

  marketCard(model) {
    const locked = this.store.state.completed.length < model.unlock;
    return `<article class="market-card"><button class="photo-button" data-action="model" data-id="${model.id}">${photo(model.id)}<span class="manufacturer-pill">${model.manufacturer}</span>${locked ? `<span class="unlock-badge">${icon('lock')} 完成 ${model.unlock} 份委託</span>` : ''}</button><div class="market-card-body"><div class="eyebrow">${model.generation}</div><h3>${model.name}</h3><p>${model.role}</p><div class="mini-specs"><span>${model.seats} 席</span><span>${integer(model.range)} km</span><span>${model.engine}</span></div><div class="purchase-options"><button data-action="acquire" data-id="${model.id}" data-mode="lease" ${locked ? 'disabled' : ''}><span>租賃首期 ${money(model.deposit, true)}</span><b>${money(model.lease)}<small>／日</small></b>${icon('arrow')}</button><button data-action="acquire" data-id="${model.id}" data-mode="purchase" ${locked ? 'disabled' : ''}><span>購入飛機</span><b>${money(model.purchase, true)}</b>${icon('plus')}</button></div></div></article>`;
  }

  renderAircraft() {
    const { ui } = this.store;
    const models = AIRCRAFT.filter((model) => ui.manufacturer === 'all' || model.manufacturer === ui.manufacturer);
    this.root.querySelector('#view-aircraft').innerHTML = `<div class="section-heading"><div class="segmented manufacturer-filter">${[['all', '全部機型'], ['Airbus', 'Airbus'], ['Boeing', 'Boeing'], ['Embraer', 'Embraer']].map(([id, title]) => `<button data-action="filter" data-id="${id}" class="${ui.manufacturer === id ? 'active' : ''}">${title}</button>`).join('')}</div><button class="secondary-button" data-action="compare-open" ${ui.compare.length !== 2 ? 'disabled' : ''}>${icon('compare')} 比較機型 <span>${ui.compare.length}/2</span></button></div><div class="aircraft-grid book-grid">${models.map((model) => `<article class="book-card"><button class="photo-button" data-action="model" data-id="${model.id}">${photo(model.id)}<span class="manufacturer-pill">${model.manufacturer}</span></button><div class="book-card-body"><span class="eyebrow">${model.generation} · ${model.category}</span><button class="model-name-button" data-action="model" data-id="${model.id}">${model.name}${icon('arrow')}</button><p>${model.role}</p><div class="book-specs"><div><span>示例座位</span><b>${model.seats}</b></div><div><span>參考航程</span><b>${integer(model.range)}<small> km</small></b></div><div><span>機身長度</span><b>${model.length}<small> m</small></b></div></div><button class="compare-toggle ${ui.compare.includes(model.id) ? 'selected' : ''}" data-action="compare-toggle" data-id="${model.id}" aria-pressed="${ui.compare.includes(model.id)}">${icon(ui.compare.includes(model.id) ? 'check' : 'plus')} ${ui.compare.includes(model.id) ? '已加入比較' : '加入比較'}</button></div></article>`).join('')}</div><div class="info-note">${icon('info')} 航程與尺寸為公開參考配置，實際能力依認證、載重與環境而異；座位、費用及營運參數為遊戲配置。不同引擎選項需核對確切型號。</div>`;
  }

  renderMissions() {
    const { state } = this.store;
    this.root.querySelector('#view-missions').innerHTML = `<div class="campaign-banner"><div><span class="eyebrow">FROM WARSAW TO THE WORLD</span><h2>${state.completed.length === 6 ? '世界，已經成為你的航線圖。' : '六段航程，一間國際航空公司。'}</h2><p>透過真實工作的取捨，累積機隊知識與營運判斷。</p></div><div class="campaign-count">${state.completed.length}<span>/ 6</span></div></div><div class="mission-grid">${MISSIONS.map((mission) => {
      const done = state.completed.includes(mission.id); const locked = state.completed.length < mission.unlock; const progress = missionProgress(state, mission);
      return `<article class="contract-card ${done ? 'complete' : ''}"><div class="contract-top"><span>CHAPTER ${mission.chapter}</span><span class="status-pill static ${done ? 'operating' : ''}">${done ? '已完成' : locked ? `需完成 ${mission.unlock} 份委託` : state.activeMission === mission.id ? '進行中' : '可接受'}</span></div><div class="contract-route">WAW <span>→</span> ${mission.destination}<small>${AIRPORTS[mission.destination].city}</small></div><h3>${mission.title}</h3><p>${mission.brief}</p><ul class="contract-targets"><li>${icon('people')} 運送 ${integer(mission.pax)} 位旅客</li><li>${icon('clock')} 至少 ${mission.days} 個營運日</li><li>${icon('chart')} 載客率 ${percent(mission.load)}、航線累計獲利</li></ul>${bar(progress.fraction)}<div class="contract-bottom"><b>${money(mission.reward)}</b><button class="${done ? 'secondary' : 'primary'}-button" data-action="${done ? 'airport' : 'accept'}" data-id="${done ? mission.destination : mission.id}" ${locked ? 'disabled' : ''}>${done ? '查看航線' : locked ? '尚未解鎖' : state.activeMission === mission.id ? '前往規劃' : '接受委託'} ${icon(locked ? 'lock' : 'arrow')}</button></div></article>`;
    }).join('')}</div>`;
  }

  historyPanel() {
    const history = this.store.state.history.slice(-12);
    if (!history.length) return '';
    const max = Math.max(1, ...history.map((day) => Math.abs(day.profit)));
    return `<article class="history-panel"><div class="section-heading"><div><h2>營運日誌</h2><span>最近 ${history.length} 個營運日 · 淨利不含委託獎勵</span></div><button class="text-button" data-action="report">詳細日結 ${icon('arrow')}</button></div><div class="history-chart">${history.map((day) => `<div title="第 ${day.day} 天：${money(day.profit)}"><b class="${day.profit < 0 ? 'negative' : ''}" style="height:${Math.max(8, Math.abs(day.profit) / max * 75)}px"></b><small>D${day.day}</small><span>${money(day.profit, true)}</span></div>`).join('')}</div></article>`;
  }

  handleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const { action, id, mode } = button.dataset;
    this.playSound('click');
    if (action === 'nav') { this.closeModal(); this.store.setUI({ view: id }); this.root.querySelector('.main-content').scrollTop = 0; }
    else if (action === 'airport') { this.closeModal(); this.store.selectDestination(id); }
    else if (action === 'map') this.store.setUI({ mapMode: id });
    else if (action === 'plan') this.openPlanner(id);
    else if (action === 'pause') this.perform('pause', { destination: id });
    else if (action === 'fleet-tab') this.store.setUI({ fleetTab: id });
    else if (action === 'filter') this.store.setUI({ manufacturer: id });
    else if (action === 'model') this.openModel(id);
    else if (action === 'unit') this.openUnit(id);
    else if (action === 'acquire') this.openAcquisition(id, mode);
    else if (action === 'acquire-confirm') { if (this.perform('acquire', { type: id, mode }).ok) { this.closeModal(); this.store.setUI({ view: 'fleet', fleetTab: 'owned' }); } }
    else if (action === 'maintain') { if (this.perform('maintain', { id, kind: mode }).ok) this.openUnit(id); }
    else if (action === 'advance') this.nextDay();
    else if (action === 'report') this.openReport();
    else if (action === 'close') this.closeModal();
    else if (action === 'confirm-plan') this.confirmPlan();
    else if (action === 'accept') {
      const mission = MISSIONS.find((item) => item.id === id);
      if (this.perform('accept', { id }).ok) { this.store.selectDestination(mission.destination); this.closeModal(); }
    }
    else if (action === 'advice') this.openAdvice(id);
    else if (action === 'structure') this.openStructure('wing');
    else if (action === 'part') this.openStructure(id);
    else if (action === 'compare-toggle') {
      const compare = [...this.store.ui.compare]; const index = compare.indexOf(id);
      if (index >= 0) compare.splice(index, 1);
      else if (compare.length < 2) compare.push(id);
      else { this.toast('先取消一款機型，再加入新的比較。'); return; }
      this.store.setUI({ compare });
    }
    else if (action === 'compare-open') this.openCompare();
    else if (action === 'sound') { this.store.dispatch('sound', { enabled: !this.store.state.sound }); if (this.store.state.sound) this.playSound('confirm'); if (this.modalRoot.querySelector('.settings-dialog')) this.openSettings(); }
    else if (action === 'settings') this.openSettings();
    else if (action === 'credits') this.openCredits();
    else if (action === 'inbox') this.openInbox();
    else if (action === 'guide') this.openGuide();
    else if (action === 'reset') this.openModal('重新接手公司', '<div class="dialog-body"><p>目前這間公司的本機進度會重設。你會回到第 1 天，重新取得三架飛機與起始資金。</p><div class="dialog-actions"><button class="secondary-button" data-action="close">保留目前公司</button><button class="primary-button" data-action="reset-confirm">重新開始</button></div></div>');
    else if (action === 'reset-confirm') { this.closeModal(); this.store.ui = { view: 'operations', selected: 'CPH', mapMode: 'europe', fleetTab: 'owned', manufacturer: 'all', compare: [] }; this.store.dispatch('reset'); this.toast('新的營運日，從華沙開始。'); }
    else if (action === 'bailout') this.perform('bailout');
  }

  perform(action, payload) {
    const result = this.store.dispatch(action, payload);
    if (result.message) this.toast(result.message, !result.ok);
    this.playSound(result.ok ? 'confirm' : 'error');
    return result;
  }

  nextDay() {
    if (this.turnBusy || this.modal) return;
    this.turnBusy = true;
    const result = this.store.dispatch('advance');
    if (result.report.completed.length) {
      const next = availableMission(this.store.state);
      if (next) this.store.selectDestination(next.destination);
      this.playSound('confirm');
    }
    this.openReport(result.report);
    setTimeout(() => { this.turnBusy = false; const button = this.root.querySelector('.advance-button'); if (button) button.disabled = false; }, 350);
  }

  openModal(title, body, { wide = false, kind = 'generic' } = {}) {
    if (!this.modal) this.previousFocus = document.activeElement;
    this.modal = kind;
    this.modalRoot.hidden = false;
    this.modalRoot.innerHTML = `<div class="modal-backdrop"><section class="dialog ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header class="dialog-header"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-action="close" aria-label="關閉視窗">${icon('close')}</button></header>${body}</section></div>`;
    this.modalRoot.querySelector('.modal-backdrop').addEventListener('click', (event) => { if (event.target === event.currentTarget) this.closeModal(); });
    requestAnimationFrame(() => this.modalRoot.querySelector('[data-action="close"]')?.focus());
  }

  closeModal() {
    this.modal = null;
    if (this.modalRoot) { this.modalRoot.hidden = true; this.modalRoot.innerHTML = ''; }
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }

  openPlanner(destination) {
    const { state } = this.store;
    const airport = AIRPORTS[destination]; if (!airport?.demand) return;
    const existing = state.routes.find((route) => route.destination === destination);
    const free = state.fleet.find((plane) => !plane.maintenance && plane.health >= 45 && !state.routes.some((route) => route.active && route.aircraftId === plane.id && route.destination !== destination));
    const selected = existing?.aircraftId || free?.id || state.fleet[0].id;
    const options = state.fleet.map((plane) => `<option value="${plane.id}" ${plane.id === selected ? 'selected' : ''}>${AIRCRAFT_BY_ID[plane.type].short} · ${plane.registration} · ${status(plane, state)}</option>`).join('');
    this.openModal(`航線提案 <span class="dialog-title-code">WAW → ${destination}</span>`, `<div class="planner-layout"><div class="planner-form"><div class="planner-route"><div><span>華沙</span><b>WAW</b></div><div>${icon('plane')}<span>${integer(distanceKm(destination))} km</span></div><div><span>${airport.city}</span><b>${destination}</b></div></div><div class="planner-context"><span>模擬每日雙向需求 <b>${airport.demand} 人</b></span><span>${existing ? '既有航線調整' : `開航投入 ${money(airport.opening)}`}</span></div><form id="route-plan-form"><input type="hidden" name="destination" value="${destination}"/><label class="field-label" for="plan-aircraft">選擇執飛飛機</label><select id="plan-aircraft" name="aircraftId">${options}</select><div id="planner-aircraft"></div><label class="field-label" for="plan-frequency">每日往返班次</label><select id="plan-frequency" name="frequency"><option value="1" ${existing?.frequency !== 2 ? 'selected' : ''}>1 往返 · 每日 2 個航段</option><option value="2" ${existing?.frequency === 2 ? 'selected' : ''}>2 往返 · 每日 4 個航段</option></select><label class="field-label">服務定位</label><div class="service-options">${Object.values(SERVICES).map((service) => `<label class="service-option"><input type="radio" name="service" value="${service.id}" ${(existing?.service || 'standard') === service.id ? 'checked' : ''}/><span><b>${service.name}</b><small>${service.description}</small></span></label>`).join('')}</div></form><button class="text-button" data-action="advice" data-id="${destination}">${icon('people')} 詢問營運顧問</button></div><aside class="planner-preview" id="planner-preview"></aside></div>`, { wide: true, kind: 'planner' });
    this.updateForecast();
  }

  readPlan() {
    const form = this.modalRoot.querySelector('#route-plan-form');
    if (!form) return null;
    const values = new FormData(form);
    return { destination: values.get('destination'), aircraftId: values.get('aircraftId'), frequency: Number(values.get('frequency')), service: values.get('service') };
  }

  updateForecast() {
    const plan = this.readPlan(); if (!plan) return;
    const result = forecast(this.store.state, plan.destination, plan.aircraftId, plan.frequency, plan.service); if (!result) return;
    const error = validatePlan(this.store.state, plan);
    this.modalRoot.querySelector('#planner-aircraft').innerHTML = `<div class="planner-model">${photo(result.model.id)}<div><b>${result.model.short}</b><span>${result.model.seats} 席 · ${result.model.engine}</span><small>${result.model.generation}</small></div></div>`;
    this.modalRoot.querySelector('#planner-preview').innerHTML = `<div class="eyebrow">ROUTE FEASIBILITY</div><h3>讓數據，支持你的決定。</h3><div class="forecast-main"><span>預估航線日利</span><b class="${result.profit >= 0 ? 'positive' : 'negative'}">${money(result.profit)}</b></div><dl class="forecast-rows"><div><dt>每日運能</dt><dd>${result.capacity} 人</dd></div><div><dt>預估旅客</dt><dd>${result.pax} 人</dd></div><div><dt>預估載客率</dt><dd>${percent(result.load)}</dd></div><div><dt>航線營收</dt><dd>${money(result.revenue)}</dd></div><div><dt>飛行與服務成本</dt><dd>${money(result.operating)}</dd></div><div><dt>本機日租金／固定成本</dt><dd>${money(result.lease + 850)}</dd></div><div><dt>飛機使用時間</dt><dd>${result.hours.toFixed(1)} / 22 h</dd></div><div><dt>任務需求／參考航程</dt><dd class="${!result.rangeEnough ? 'negative' : ''}">${integer(result.rangeRequired)} / ${integer(result.model.range)} km</dd></div></dl><div class="forecast-feedback ${error ? 'error' : result.load < 0.65 ? 'caution' : 'success'}">${icon(error ? 'info' : 'check')}<p>${e(error || (result.load < 0.65 ? '空位較多，可能無法達成委託載客率。可以換較小的機型、減少班次或調整服務定位。' : '方案可投入營運。確認後會保留此設定，每個營運日持續執飛。'))}</p></div><button class="primary-button full-width" data-action="confirm-plan">確認${this.store.state.routes.some((route) => route.destination === plan.destination) ? '更新方案' : '開航'} ${icon('arrow')}</button><p class="fine-print">航程餘裕、使用時數與所有收支為遊戲模型；預估航線日利不含公司管理費與其他閒置機隊。</p>`;
  }

  confirmPlan() {
    const plan = this.readPlan(); if (!plan) return;
    if (this.perform('plan', plan).ok) { this.closeModal(); this.store.selectDestination(plan.destination); }
  }

  openModel(id) {
    const model = AIRCRAFT_BY_ID[id]; if (!model) return;
    this.store.dispatch('view', { id });
    this.openModal(model.name, `<div class="model-detail"><div class="model-photo">${photo(id)}<span class="photo-caption">實機參考照片 · 塗裝不代表遊戲營運商</span></div><div class="model-detail-body"><div class="eyebrow">${model.manufacturer} / ${model.generation}</div><h3>${model.role}</h3><p>${model.description}</p><div class="detail-specs"><div><span>示例座位</span><b>${model.seats}</b></div><div><span>參考航程</span><b>${integer(model.range)}<small> km</small></b></div><div><span>機身長度</span><b>${model.length}<small> m</small></b></div><div><span>參考翼展</span><b>${model.span}<small> m</small></b></div></div><div class="engine-block"><span>引擎選項</span><b>${model.engineOptions}</b></div><h4>辨識與定位線索</h4><ul class="feature-list">${model.features.map((feature) => `<li>${icon('check')}<span>${feature}</span></li>`).join('')}</ul><div class="detail-actions"><button class="secondary-button" data-action="structure">${icon('info')} 查看飛機構造</button><a class="text-button" href="${model.source}" target="_blank" rel="noopener noreferrer">參考資料 ${icon('arrow')}</a></div><p class="fine-print">公開航程依配置、載重與環境而變；示例座位與收支為本遊戲設定。照片作者與授權可在「設定與資料來源」查閱。</p></div></div>`, { wide: true });
  }

  openUnit(id) {
    const plane = this.store.state.fleet.find((item) => item.id === id); if (!plane) return;
    const model = AIRCRAFT_BY_ID[plane.type];
    const route = this.store.state.routes.find((item) => item.active && item.aircraftId === id);
    this.openModal(`機務管理 <span class="dialog-title-code">${plane.registration}</span>`, `<div class="unit-detail"><div class="unit-summary">${photo(plane.type)}<div><span class="eyebrow">${model.generation}</span><h3>${model.name}</h3><p>${status(plane, this.store.state)}${route ? ` · WAW–${route.destination}` : ''}</p><div class="condition-row"><span>維護指標</span><b>${Math.round(plane.health)}%</b></div>${bar(plane.health / 100, plane.health < 65 ? 'warning' : '')}</div></div><div class="staff-inline">${avatar('tomasz')}<div><b>Tomasz <span>機務主管</span></b><p>${plane.maintenance ? `飛機正在停場，還需 ${plane.maintenance} 個營運日。完成保養當天不會同時執飛。` : '保養要付出的不只有費用，還有可用運能。請先想好停場期間的派機安排。'}</p></div></div><div class="maintenance-options"><button data-action="maintain" data-id="${id}" data-mode="line" ${plane.maintenance ? 'disabled' : ''}>${icon('wrench')}<b>例行保養</b><span>停場 1 天 · 指標恢復 28 點，上限 100</span><strong>€28,000</strong></button><button data-action="maintain" data-id="${id}" data-mode="deep" ${plane.maintenance ? 'disabled' : ''}>${icon('fleet')}<b>完整保養</b><span>停場 2 天 · 指標恢復至 100</span><strong>€95,000</strong></button></div><button class="secondary-button full-width" data-action="structure">${icon('info')} 走進機庫：查看飛機結構與原理</button><p class="fine-print">維護指標與保養時長為遊戲抽象模型，並非真實檢修程序或適航判定。</p></div>`);
  }

  openAcquisition(id, mode) {
    const model = AIRCRAFT_BY_ID[id]; if (!model) return;
    const lease = mode === 'lease'; const cost = lease ? model.deposit : model.purchase;
    this.openModal(`${lease ? '租賃' : '購買'} ${model.short}`, `<div class="dialog-body acquisition-dialog">${photo(id)}<div class="staff-inline">${avatar('anna')}<div><b>Anna <span>機隊顧問</span></b><p>${lease ? '首期投入較低，但之後每天都有租金，包括沒有派飛的日子。' : '購入後不需日租金，但一次占用的資金較多。請保留足夠的營運與保養預算。'}</p></div></div><dl class="forecast-rows"><div><dt>${lease ? '租賃首期投入' : '購買投入'}</dt><dd>${money(cost)}</dd></div>${lease ? `<div><dt>日租金</dt><dd>${money(model.lease)}</dd></div>` : ''}<div><dt>完成後可用資金</dt><dd class="${this.store.state.cash < cost ? 'negative' : ''}">${money(this.store.state.cash - cost)}</dd></div></dl><div class="dialog-actions"><button class="secondary-button" data-action="close">再考慮一下</button><button class="primary-button" data-action="acquire-confirm" data-id="${id}" data-mode="${mode}" ${this.store.state.cash < cost ? 'disabled' : ''}>確認${lease ? '租賃' : '購入'} ${icon('arrow')}</button></div><p class="fine-print">交付時間簡化為立即可用，金額為遊戲平衡設定。</p></div>`);
  }

  openReport(report = this.store.state.report) {
    if (!report) { this.toast('完成第一個營運日後，就會有日結報告。'); return; }
    const completion = report.completed.map((id) => MISSIONS.find((mission) => mission.id === id));
    this.openModal(`營運日結 <span class="dialog-title-code">DAY ${String(report.day).padStart(2, '0')}</span>`, `<div class="dialog-body report-dialog">${completion.length ? `<div class="completion-banner">${icon('star')}<div><b>${this.store.state.completed.length === 6 ? '你已帶領公司成為國際航空公司！' : '董事會委託完成'}</b><span>${completion.map((mission) => mission.title).join('、')} · 獎勵 ${money(report.rewards)}</span></div></div>` : ''}<div class="report-metrics"><div><span>公司營運淨利</span><b class="${report.profit >= 0 ? 'positive' : 'negative'}">${money(report.profit)}</b></div><div><span>今日服務旅客</span><b>${integer(report.passengers)}<small> 人</small></b></div><div><span>今日營收／成本</span><b>${money(report.revenue, true)}<small> / ${money(report.costs, true)}</small></b></div></div><div class="report-route-list">${report.routes.map((route) => `<div class="report-route"><div><b>WAW → ${route.destination}</b><small>${route.cancelled ? e(route.reason) : `${route.model} · ${route.registration}`}</small></div>${route.cancelled ? '<span class="tag warning">本日未執飛</span>' : `<div><b>${route.pax}<small> 位旅客</small></b><span>載客率 ${percent(route.load)}</span></div><strong class="${route.profit >= 0 ? 'positive' : 'negative'}">${money(route.profit)}</strong>`}</div>`).join('') || '<div class="empty-state">今天沒有營運中的航線，可以先到調度台規劃。</div>'}</div>${report.maintenance.map((message) => `<div class="info-note">${icon('wrench')}${e(message)}</div>`).join('')}<div class="report-insight">${avatar(completion.length ? 'marta' : 'anna')}<div><b>${completion.length ? '這次營運帶來的理解' : '給下一個營運日的建議'}</b><p>${e(completion[0]?.lesson || (report.routes.some((route) => route.cancelled) ? '停場會減少收入。可以先暫停原派機，改派可用飛機，再安排下一天。' : report.routes.some((route) => route.load < 0.65) ? '有航線空位較多。試著用較小的機型、較少班次或不同服務定位，觀察成本與載客率如何改變。' : '檢查各航線的載客率、日利與維護指標。現在可以調整方案、開拓市場，或安排保養。'))}</p></div></div><p class="fine-print">公司成本包含各航線營運、所有飛機日租與固定成本，以及 €1,800 管理費；委託獎勵另計，已加入公司資金。</p><button class="primary-button full-width" data-action="close">繼續規劃下一天 ${icon('arrow')}</button></div>`, { wide: true });
  }

  openAdvice(destination) {
    const mission = MISSIONS.find((item) => item.destination === destination);
    this.openModal('營運顧問的建議', `<div class="dialog-body"><div class="staff-banner">${avatar('marta')}<div><b>Marta · 營運總監</b><p>${e(mission?.advice || '先看市場需求，再比較每種派機方案的運能與完整成本。')}</p></div></div><p>比較時可以依序檢查：航程是否足夠、座位與班次是否合適、飛機是否可用，以及最後的收支。好方案可能不只一種。</p><button class="primary-button full-width" data-action="plan" data-id="${destination}">帶著這些線索回到提案 ${icon('arrow')}</button></div>`);
  }

  openCompare() {
    const models = this.store.ui.compare.map((id) => AIRCRAFT_BY_ID[id]); if (models.length !== 2) return;
    const rows = [['示例座位', (model) => `${model.seats} 席`], ['參考航程', (model) => `${integer(model.range)} km`], ['機身長度', (model) => `${model.length} m`], ['參考翼展', (model) => `${model.span} m`], ['世代', (model) => model.generation], ['引擎配置／選項', (model) => model.engineOptions], ['市場定位', (model) => model.role], ['租賃首期／日租', (model) => `${money(model.deposit)} / ${money(model.lease)}`]];
    this.openModal('兩機對照｜讓差異變得清楚', `<div class="dialog-body"><div class="compare-photos">${models.map((model) => `<div>${photo(model.id)}<h3>${model.name}</h3></div>`).join('')}</div><div class="table-wrap"><table class="compare-table"><tbody>${rows.map(([label, value]) => `<tr><th>${label}</th>${models.map((model) => `<td>${value(model)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="info-note">${icon('info')} 相同座位數或相近機身長度，不代表相同世代與用途。再回到目標航線，檢查哪個取捨更適合。</div></div>`, { wide: true });
  }

  openStructure(part = 'wing') {
    this.store.dispatch('inspect', { id: part });
    const parts = {
      wing: ['主翼與升力', '主翼與周圍氣流的交互作用產生氣動力。升力與速度、空氣密度、迎角和翼型等因素有關；迎角並非越大越好。', '翼尖與機翼設計會影響阻力與效率。辨識機型時可以觀察，但仍需核對確切子型。'],
      engine: ['引擎與推力', '渦扇引擎加速氣流，產生推力；推力與阻力、升力與重量共同影響飛行狀態。引擎提供動力，不等於它單獨把飛機「托住」。', 'CFM56、LEAP 與 PW GTF 是不同引擎系列。配置會影響維修、性能與機型識別，不能只用機身名稱代替。'],
      tail: ['尾翼與姿態控制', '水平尾翼、垂直尾翼和控制面參與穩定與姿態控制。升降舵、方向舵與副翼的作用不同，不能以一個部件解釋所有轉向。', '營運安排需要可靠的飛機系統。此處用結構圖理解功能，具體保養由機務團隊執行。'],
      gear: ['起落架與地面承載', '起落架在地面承載飛機、吸收著陸能量，並與輪胎、煞車及轉向系統配合。收放式起落架在飛行中收起可減少阻力。', '地面作業與維護也占用時間。保養不只是費用，還會影響今天有哪些飛機可以執飛。'],
    };
    const content = parts[part] || parts.wing;
    const hotspot = (id, label, x, y) => `<button class="part-hotspot ${id === part ? 'selected' : ''}" style="left:${x}%;top:${y}%" data-action="part" data-id="${id}"><span></span><b>${label}</b></button>`;
    this.openModal('走進機庫｜飛機結構與原理', `<div class="structure-layout"><div class="structure-diagram"><span class="diagram-label">AIRFRAME OVERVIEW · 結構示意</span><svg viewBox="0 0 520 460" aria-label="飛機俯視結構示意"><defs><linearGradient id="body-fill" x1="0" x2="1"><stop stop-color="#b1c7d8"/><stop offset=".48" stop-color="#f5fbff"/><stop offset="1" stop-color="#90aabe"/></linearGradient></defs><path d="M260 28c20 20 25 64 25 133l178 110-3 22-177-53-5 127 60 49-1 15-77-25-77 25-1-15 60-49-5-127-177 53-3-22 178-110c0-69 5-113 25-133Z" fill="url(#body-fill)" stroke="#647e95" stroke-width="2"/><path d="m249 64 11-9 11 9 5 17h-32Z" fill="#19364d"/><path d="M260 100v279M238 168l22 18 22-18" fill="none" stroke="#698ba4" stroke-width="2"/><rect x="172" y="210" width="26" height="62" rx="12" fill="#8ca9bd" stroke="#e0edf7"/><rect x="322" y="210" width="26" height="62" rx="12" fill="#8ca9bd" stroke="#e0edf7"/><path d="M197 218v18M335 218v18" stroke="#223e53" stroke-width="4"/></svg>${hotspot('wing', '主翼', 21, 56)}${hotspot('engine', '引擎', 70, 53)}${hotspot('tail', '尾翼', 61, 84)}${hotspot('gear', '起落架', 58, 28)}<span class="diagram-footer">點選標記，查看功能與營運連結</span></div><div class="structure-copy"><div class="eyebrow">TOMASZ'S HANGAR NOTES</div><h3>${content[0]}</h3><p>${content[1]}</p><div class="structure-connection"><b>與你的營運決策有什麼關係？</b><p>${content[2]}</p></div><div class="four-forces"><span>↑ 升力</span><div><span>← 阻力</span>${icon('plane')}<span>推力 →</span></div><span>↓ 重量</span></div><p class="fine-print">這是功能與受力的概念示意，並非實機維修或飛行操作指引。</p><a class="text-button" href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/" target="_blank" rel="noopener noreferrer">NASA 航空原理參考 ${icon('arrow')}</a></div></div>`, { wide: true });
  }

  openInbox() {
    this.openModal('團隊訊息｜辦公桌上的新消息', `<div class="dialog-body inbox-list">${this.store.state.messages.map((message) => `<article>${avatar(message.person)}<div><div class="message-meta"><b>${STAFF[message.person]?.name || '團隊'}<span>${STAFF[message.person]?.role || ''}</span></b><small>DAY ${message.day}</small></div><h3>${e(message.title)}</h3><p>${e(message.text)}</p></div></article>`).join('')}</div>`);
  }

  openSettings() {
    this.openModal('營運席位設定', `<div class="dialog-body settings-dialog"><div class="setting-row"><div><b>介面音效</b><p>Kenney 操作與確認音效</p></div><button class="toggle ${this.store.state.sound ? 'on' : ''}" data-action="sound" aria-label="切換介面音效" aria-pressed="${this.store.state.sound}"><span></span></button></div><div class="setting-row"><div><b>本機進度</b><p>每次決策後自動儲存，重新整理可繼續。</p></div>${icon('check')}</div><button class="secondary-button full-width" data-action="credits">${icon('book')} 資料、照片與素材來源</button>${this.store.state.cash < 500000 && !this.store.state.bailoutUsed ? '<button class="secondary-button full-width" data-action="bailout">申請董事會過橋融資</button>' : ''}<button class="text-button reset-button" data-action="reset">${icon('refresh')} 重新接手一間公司</button></div>`);
  }

  openCredits() {
    this.openModal('資料與素材來源', `<div class="dialog-body credits-dialog"><p>客機照片保留原作者署名與授權。照片中的品牌是辨識參考；Vistula Air 是虛構的遊戲公司。</p><h3>飛機知識</h3><p>機型資料參考 Airbus、Boeing、Embraer 與引擎製造商公開資料。航程依特定配置而變，座位與所有財務、需求、維修參數為遊戲設定。各機型資料卡提供官方參考連結。</p><h3>素材署名</h3><div class="credits-list">${this.credits.map((credit) => `<article><b>${e(credit.title.replace(/^File:/, ''))}</b><span>${e(credit.author)} · ${e(credit.license)}</span><div><a href="${e(credit.source)}" target="_blank" rel="noopener noreferrer">原始來源</a>${credit.licenseUrl ? `<a href="${e(credit.licenseUrl)}" target="_blank" rel="noopener noreferrer">授權條款</a>` : ''}</div></article>`).join('') || '<p>完整署名位於遊戲的 assets/licenses/ASSET-CREDITS.md。</p>'}</div><p>機場位置：OurAirports / datasets/airport-codes；地圖：Natural Earth。介面標誌、人物肖像與結構圖為本專案原創 SVG。</p></div>`, { wide: true });
  }

  openGuide() {
    this.openModal('工作手冊｜你的第一條新航線', `<div class="dialog-body guide-dialog"><div class="guide-intro">${avatar('marta')}<div><b>歡迎就任，營運長。</b><p>你不需要搶時間。研究資料，做出決定，再讓時間前進。</p></div></div><ol><li><b>接受委託</b><p>先看哥本哈根的需求與條件，或到董事會選擇其他委託。</p></li><li><b>比較並派機</b><p>在「規劃航線」選擇飛機、班次和服務。看載客率與成本，確認後開航。</p></li><li><b>推進營運日</b><p>點右上角「下一營運日」，閱讀各航線表現與公司收支。</p></li><li><b>調整與成長</b><p>完成委託取得資金與聲望，再購租新機、安排保養，向更遠的市場前進。</p></li></ol><div class="keyboard-guide"><span><kbd>1</kbd>–<kbd>5</kbd> 切換工作區</span><span><kbd>Space</kbd> 推進營運日</span><span><kbd>Esc</kbd> 關閉視窗</span></div><button class="primary-button full-width" data-action="close">回到我的營運席位 ${icon('arrow')}</button></div>`);
  }

  handleKey(event) {
    if (this.modal) {
      if (event.key === 'Escape') this.closeModal();
      if (event.key === 'Tab') {
        const focusable = [...this.modalRoot.querySelectorAll('button:not([disabled]), select, input, a[href]')];
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
    if (/^[1-5]$/.test(event.key)) this.store.setUI({ view: NAV[Number(event.key) - 1][0] });
    if (event.code === 'Space' && event.target.tagName !== 'BUTTON') { event.preventDefault(); if (!event.repeat) this.nextDay(); }
  }

  playSound(name) {
    if (!this.store.state.sound) return;
    try {
      this.audio[name] ||= new Audio(asset(`audio/sfx/${name}.ogg`));
      this.audio[name].volume = name === 'click' ? 0.12 : 0.22;
      this.audio[name].currentTime = 0;
      this.audio[name].play().catch(() => {});
    } catch { /* Audio is optional; gameplay remains available. */ }
  }

  toast(message, error = false) {
    clearTimeout(this.toastTimer);
    this.toastRoot.innerHTML = `${icon(error ? 'info' : 'check')}<span>${e(message)}</span>`;
    this.toastRoot.className = `toast visible ${error ? 'error' : ''}`;
    this.toastTimer = setTimeout(() => this.toastRoot.classList.remove('visible'), error ? 6500 : 4200);
  }
}
