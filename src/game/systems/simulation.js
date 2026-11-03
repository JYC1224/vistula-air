import { AIRPORTS, MISSIONS, SERVICES } from '../data/airports.js';
import { AIRCRAFT_BY_ID } from '../data/aircraft.js';

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'vistula-air-save-v1';

export function distanceKm(destination) {
  const a = AIRPORTS.WAW;
  const b = AIRPORTS[destination];
  if (!b) return 0;
  const rad = (angle) => angle * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371.009 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

export function createInitialState() {
  return {
    version: SAVE_VERSION, day: 1, cash: 8400000, reputation: 58, passengers: 0, cumulativeProfit: 0,
    completed: [], activeMission: 'cph', bailoutUsed: false, sound: false,
    fleet: [
      { id: 'VA101', registration: 'SP-VAA', type: 'e190', health: 94, maintenance: 0, recovery: 0, lease: 0 },
      { id: 'VA102', registration: 'SP-VAB', type: 'a320', health: 87, maintenance: 0, recovery: 0, lease: 0 },
      { id: 'VA103', registration: 'SP-VAC', type: 'b738', health: 72, maintenance: 0, recovery: 0, lease: 0 },
    ],
    routes: [{ destination: 'VIE', aircraftId: 'VA102', frequency: 1, service: 'standard', active: true, days: 0, pax: 0, profit: 0, offered: 0 }],
    report: null, history: [], viewed: [], inspected: [],
    messages: [{ day: 1, person: 'marta', title: '歡迎回到華沙', text: '董事會把下一階段的航線擴張交給你。先研究哥本哈根的需求，派出合適的飛機。準備好後，再推進營運日。' }],
  };
}

export function forecast(state, destination, aircraftIdOrType, frequency = 1, serviceId = 'standard') {
  const unit = state.fleet.find((plane) => plane.id === aircraftIdOrType);
  const model = AIRCRAFT_BY_ID[unit?.type || aircraftIdOrType];
  const airport = AIRPORTS[destination];
  const service = SERVICES[serviceId];
  if (!model || !airport?.demand || !service || ![1, 2].includes(frequency)) return null;
  const distance = distanceKm(destination);
  const hours = (distance / model.speed * 2 + 1.45) * frequency;
  const demand = Math.round(airport.demand * service.demand * (0.94 + state.reputation / 1000));
  const capacity = model.seats * 2 * frequency;
  const pax = Math.min(capacity, demand);
  const fare = Math.round(airport.fare * service.fare);
  const revenue = pax * fare;
  const operating = Math.round((model.baseCost * 2 + distance * 2 * model.kmCost + airport.fee) * frequency + pax * service.perPax);
  const lease = unit?.lease || 0;
  const profit = revenue - operating - lease - 850;
  return { distance, hours, demand, capacity, pax, fare, revenue, operating, lease, profit, load: pax / capacity, rangeRequired: Math.round(distance * 1.08), rangeEnough: distance * 1.08 <= model.range, model };
}

export function availableMission(state) {
  return MISSIONS.find((mission) => mission.id === state.activeMission) || MISSIONS.find((mission) => !state.completed.includes(mission.id) && mission.unlock <= state.completed.length) || null;
}

export function missionProgress(state, mission) {
  const route = state.routes.find((item) => item.destination === mission.destination);
  const load = route?.offered ? route.pax / route.offered : 0;
  return { pax: route?.pax || 0, days: route?.days || 0, profit: route?.profit || 0, load,
    fraction: Math.min(1, Math.min((route?.pax || 0) / mission.pax, (route?.days || 0) / mission.days, load / mission.load)) };
}

export function validatePlan(state, plan) {
  const plane = state.fleet.find((item) => item.id === plan.aircraftId);
  if (!plane) return '請先選擇一架公司飛機。';
  if (!AIRPORTS[plan.destination]?.demand) return '請選擇有效的航線目的地。';
  const mission = MISSIONS.find((item) => item.destination === plan.destination);
  if (mission && mission.unlock > state.completed.length) return `這個市場需要先完成 ${mission.unlock} 份委託。`;
  const other = state.routes.find((route) => route.active && route.aircraftId === plane.id && route.destination !== plan.destination);
  if (other) return `這架飛機正在執飛 WAW–${other.destination}。請先暫停原航線，或選擇其他飛機。`;
  if (plane.maintenance > 0) return '這架飛機正在保養中，完成後才能派飛。';
  if (plane.health < 45) return '機務已暫停這架飛機的派飛資格，請先安排保養。';
  const result = forecast(state, plan.destination, plane.id, plan.frequency, plan.service);
  if (!result) return '班次或服務設定無效。';
  if (!result.rangeEnough) return `航程不足：本任務需要約 ${result.rangeRequired.toLocaleString()} km（含遊戲餘裕），${result.model.short} 的參考航程為 ${result.model.range.toLocaleString()} km。`;
  if (result.hours > 22) return '這個班次安排超過單架飛機每日 22 小時的遊戲使用上限。請減少班次。';
  const existing = state.routes.find((route) => route.destination === plan.destination);
  if (!existing && state.cash < AIRPORTS[plan.destination].opening) return '開航資金不足，請先調整支出或使用公司復甦融資。';
  return null;
}

function addMessage(state, person, title, text) {
  state.messages.unshift({ day: state.day, person, title, text });
  state.messages = state.messages.slice(0, 24);
}

function fail(state, message) { return { ok: false, state, message }; }

export function act(original, action, payload = {}) {
  const state = structuredClone(original);
  if (action === 'plan') {
    const error = validatePlan(state, payload);
    if (error) return fail(original, error);
    let route = state.routes.find((item) => item.destination === payload.destination);
    const isNew = !route;
    if (!route) {
      state.cash -= AIRPORTS[payload.destination].opening;
      route = { destination: payload.destination, days: 0, pax: 0, profit: 0, offered: 0 };
      state.routes.push(route);
    }
    Object.assign(route, { aircraftId: payload.aircraftId, frequency: payload.frequency, service: payload.service, active: true });
    addMessage(state, 'marta', isNew ? '新航線已排入營運' : '航線方案已更新', `WAW–${payload.destination} 將由 ${AIRCRAFT_BY_ID[state.fleet.find((plane) => plane.id === payload.aircraftId).type].short} 執飛。推進營運日後會在報告中看到實際結果。`);
    return { ok: true, state, message: isNew ? '航線已啟用。準備好後，推進下一營運日。' : '派機與班次已更新。' };
  }
  if (action === 'pause') {
    const route = state.routes.find((item) => item.destination === payload.destination);
    if (!route) return fail(original, '找不到這條航線。');
    route.active = false;
    return { ok: true, state, message: '航線已暫停，飛機可重新調配。' };
  }
  if (action === 'acquire') {
    const model = AIRCRAFT_BY_ID[payload.type];
    if (!model || !['lease', 'purchase'].includes(payload.mode)) return fail(original, '請選擇有效的採購方案。');
    if (state.completed.length < model.unlock) return fail(original, `此機型需要先完成 ${model.unlock} 份委託。可先在資料庫研究它。`);
    if (state.fleet.length >= 12) return fail(original, '目前華沙基地最多管理 12 架飛機。');
    const cost = payload.mode === 'lease' ? model.deposit : model.purchase;
    if (state.cash < cost) return fail(original, '公司資金不足，可考慮租賃或較低成本的機型。');
    state.cash -= cost;
    const number = Math.max(...state.fleet.map((plane) => Number(plane.id.slice(2)))) + 1;
    state.fleet.push({ id: `VA${number}`, registration: `SP-V${String.fromCharCode(65 + state.fleet.length)}A`, type: model.id, health: 100, maintenance: 0, recovery: 0, lease: payload.mode === 'lease' ? model.lease : 0 });
    addMessage(state, 'anna', '新成員加入機隊', `${model.name} 已完成交付，現可派飛。${payload.mode === 'lease' ? '租賃減少初期資金占用，但每天仍需支付租金。' : '購買占用較多資金，後續不需支付日租金。'}`);
    return { ok: true, state, message: `${model.short} 已加入機隊。` };
  }
  if (action === 'maintain') {
    const plane = state.fleet.find((item) => item.id === payload.id);
    if (!plane) return fail(original, '找不到這架飛機。');
    if (plane.maintenance) return fail(original, '這架飛機已在保養中。');
    const deep = payload.kind === 'deep';
    const cost = deep ? 95000 : 28000;
    if (state.cash < cost) return fail(original, '保養資金不足。');
    state.cash -= cost;
    plane.maintenance = deep ? 2 : 1;
    plane.recovery = deep ? 100 : Math.min(100, plane.health + 28);
    addMessage(state, 'tomasz', '機庫已接收飛機', `${plane.registration} 將停場 ${plane.maintenance} 個營運日。停場期間不執飛；可以暫停航線並調配替代飛機。`);
    return { ok: true, state, message: '保養已安排，停場時間將隨營運日推進。' };
  }
  if (action === 'accept') {
    const mission = MISSIONS.find((item) => item.id === payload.id);
    if (!mission || mission.unlock > state.completed.length || state.completed.includes(mission.id)) return fail(original, '這份委託目前不可接受。');
    state.activeMission = mission.id;
    return { ok: true, state, message: `已接受「${mission.title}」。既有航線與進度會保留。` };
  }
  if (action === 'view') {
    if (AIRCRAFT_BY_ID[payload.id] && !state.viewed.includes(payload.id)) state.viewed.push(payload.id);
    return { ok: true, state };
  }
  if (action === 'inspect') {
    if (['wing', 'engine', 'tail', 'gear'].includes(payload.id) && !state.inspected.includes(payload.id)) state.inspected.push(payload.id);
    return { ok: true, state };
  }
  if (action === 'sound') { state.sound = Boolean(payload.enabled); return { ok: true, state }; }
  if (action === 'bailout') {
    if (state.cash >= 500000 || state.bailoutUsed) return fail(original, '過橋融資只在資金低於 €500,000 時提供一次。');
    state.cash += 2000000; state.reputation = Math.max(20, state.reputation - 10); state.bailoutUsed = true;
    return { ok: true, state, message: '董事會提供 €2,000,000 過橋融資，聲望下降 10。請重新檢查支出與航線。' };
  }
  return fail(original, '未知的操作。');
}

export function advanceDay(original) {
  const state = structuredClone(original);
  const report = { day: state.day, routes: [], maintenance: [], revenue: 0, costs: 0, passengers: 0, rewards: 0, completed: [], profit: 0 };
  const grounded = new Set();
  for (const plane of state.fleet) {
    if (plane.maintenance > 0) {
      grounded.add(plane.id);
      plane.maintenance -= 1;
      if (!plane.maintenance) { plane.health = plane.recovery; plane.recovery = 0; report.maintenance.push(`${plane.registration} 保養完成，下一營運日可派飛。`); }
      else report.maintenance.push(`${plane.registration} 仍需 ${plane.maintenance} 天保養。`);
    }
    report.costs += 850 + plane.lease;
  }
  for (const route of state.routes.filter((item) => item.active)) {
    const plane = state.fleet.find((item) => item.id === route.aircraftId);
    if (!plane) continue;
    if (grounded.has(plane.id) || plane.health < 45) {
      report.routes.push({ destination: route.destination, cancelled: true, reason: grounded.has(plane.id) ? '飛機保養停場' : '機務暫停派飛：需先保養', pax: 0, profit: 0, load: 0 });
      continue;
    }
    const result = forecast(state, route.destination, plane.id, route.frequency, route.service);
    report.revenue += result.revenue; report.costs += result.operating; report.passengers += result.pax;
    route.days += 1; route.pax += result.pax; route.offered += result.capacity; route.profit += result.profit;
    plane.health = Math.max(0, plane.health - (1.8 * route.frequency + result.hours * 0.22));
    report.routes.push({ destination: route.destination, model: result.model.short, registration: plane.registration, pax: result.pax, capacity: result.capacity, profit: result.profit, load: result.load, revenue: result.revenue, costs: result.operating + plane.lease + 850 });
  }
  report.costs += 1800;
  report.profit = report.revenue - report.costs;
  state.cash += report.profit; state.cumulativeProfit += report.profit; state.passengers += report.passengers;
  const mission = availableMission(state);
  if (mission && !state.completed.includes(mission.id)) {
    const progress = missionProgress(state, mission);
    if (progress.pax >= mission.pax && progress.days >= mission.days && progress.load >= mission.load && progress.profit > 0) {
      state.completed.push(mission.id); state.cash += mission.reward; state.reputation = Math.min(100, state.reputation + 7); report.rewards += mission.reward; report.completed.push(mission.id);
      addMessage(state, 'marta', `委託完成：${mission.title}`, mission.lesson);
      state.activeMission = MISSIONS.find((item) => !state.completed.includes(item.id) && item.unlock <= state.completed.length)?.id || null;
    }
  }
  const concern = state.fleet.find((plane) => plane.health < 65 && !plane.maintenance);
  if (concern && !state.messages.some((message) => message.title === `${concern.registration} 保養提醒`)) {
    addMessage(state, 'tomasz', `${concern.registration} 保養提醒`, '維護指標已下降。請安排停場與替代派機；保養中的飛機不會同時執飛。你可以到機庫查看結構與保養選項。');
  }
  state.report = report;
  state.history.push({ day: state.day, profit: report.profit, passengers: report.passengers }); state.history = state.history.slice(-30);
  state.day += 1;
  return { ok: true, state, report };
}

export function validateSave(state) {
  return state?.version === SAVE_VERSION && Number.isInteger(state.day) && state.day >= 1 && Number.isFinite(state.cash) && Number.isFinite(state.reputation) && Number.isFinite(state.passengers) && Number.isFinite(state.cumulativeProfit) && ['completed', 'messages', 'history', 'viewed', 'inspected'].every((field) => Array.isArray(state[field])) && state.completed.every((id) => MISSIONS.some((mission) => mission.id === id)) && Array.isArray(state.fleet) && state.fleet.length > 0 && state.fleet.every((plane) => AIRCRAFT_BY_ID[plane.type] && Number.isFinite(plane.health) && Number.isInteger(plane.maintenance) && plane.maintenance >= 0 && Number.isFinite(plane.lease)) && Array.isArray(state.routes) && state.routes.every((route) => AIRPORTS[route.destination]?.demand && state.fleet.some((plane) => plane.id === route.aircraftId) && [1, 2].includes(route.frequency) && SERVICES[route.service]);
}
