import { defaultConfig } from './defaults.js';
import { play as previewPlay } from './engine.js';
import { views } from './games/index.js';
import { post, preview } from './nui.js';

const TABS = [
    ['dashboard', 'Dashboard', 'M4 6h16M4 12h16M4 18h10'],
    ['blackjack', 'Blackjack', 'M6 7h12v10H6z'],
    ['roulette', 'Roulette', 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16m0 4v8m-4-4h8'],
    ['slots', 'Slots', 'M5 6h4v12H5zm5 0h4v12h-4zm5 0h4v12h-4z'],
    ['poker', 'Poker', 'M7 5h6l4 4v10H7z'],
    ['crash', 'Crash', 'M4 16l6-6 4 3 6-7'],
    ['dice', 'Dice', 'M5 5h14v14H5zm4 4h.01M12 12h.01M16 16h.01'],
    ['baccarat', 'Baccarat', 'M4 8h8v10H4zm8 2h8v8h-8z'],
    ['wheel', 'Wheel', 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16m0 8h8'],
    ['mines', 'Mines', 'M6 6h4v4H6zm8 0h4v4h-4zM6 14h4v4H6zm8 0h4v4h-4z'],
    ['coinflip', 'Flip', 'M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14'],
    ['odds', 'Odds', 'M5 7h14M5 12h10M5 17h7']
];

const resultListeners = new Set();

const state = {
    view: 'dashboard',
    player: { name: 'Player', role: 'Player' },
    balance: 5000,
    stats: { wagered: 0, won: 0, lost: 0, lastWin: 0, history: [] },
    config: defaultConfig,
    bet: 100,
    busy: false
};

let destroyView = null;

function money(value) {
    const symbol = state.config.currency?.symbol || '$';
    const locale = state.config.currency?.locale || 'en-US';
    return `${symbol}${Math.floor(Number(value) || 0).toLocaleString(locale)}`;
}

function toast(message) {
    const node = document.getElementById('toast');
    node.hidden = false;
    node.textContent = message;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => {
        node.hidden = true;
    }, 2200);
}

function setBet(value) {
    const min = state.config.bets.min;
    const max = state.config.bets.max;
    state.bet = Math.max(min, Math.min(max, Math.floor(value)));
    document.querySelectorAll('.bet-box strong').forEach((node) => {
        node.textContent = money(state.bet);
    });
    document.querySelectorAll('[data-preset]').forEach((button) => {
        button.classList.toggle('on', Number(button.dataset.preset) === state.bet);
    });
}

function syncChrome() {
    document.getElementById('playerName').textContent = state.player.name;
    document.getElementById('playerRole').textContent = state.player.role;
    document.getElementById('statBalance').textContent = money(state.balance);
    document.getElementById('statWin').textContent = money(state.stats.lastWin || 0);
    document.getElementById('statWagered').textContent = money(state.stats.wagered || 0);
    document.getElementById('statWinChip').textContent = `+${Math.floor(state.stats.lastWin || 0)}`;
    document.getElementById('closeBtn').textContent = state.config.closeKey || 'RSHIFT';
    document.getElementById('statusLine').textContent = preview
        ? 'Preview mode. FiveM uses the same UI with server-authoritative settlement.'
        : 'House edge and payouts are live from the server config.';
    document.querySelectorAll('#nav button').forEach((button) => {
        button.classList.toggle('active', button.dataset.view === state.view);
    });
}

function renderView() {
    const view = document.getElementById('view');
    if (destroyView) {
        destroyView();
        destroyView = null;
    }
    const render = views[state.view];
    if (render) {
        destroyView = render(view, ctx) || null;
    }
    syncChrome();
}

function applyResult(result) {
    if (!result || !result.ok) {
        if (result && result.error && result.error !== 'No crash round is open') {
            toast(result.error);
        }
        return result;
    }
    if (typeof result.balance === 'number') state.balance = result.balance;
    if (result.stats) state.stats = result.stats;
    if (result.profit > 0) toast(`Won ${money(result.profit)}`);
    else if (result.payout === 0 && result.bet) toast('House took the bet');
    resultListeners.forEach((listener) => listener(result));
    syncChrome();
    return result;
}

async function play(action, data) {
    if (state.busy) return { ok: false, error: 'Wait for the current action' };
    state.busy = true;
    document.getElementById('statusLine').textContent = 'Settling…';
    try {
        const result = preview ? previewPlay(action, data, state) : await post('play', { action, data });
        return applyResult(result || { ok: false, error: 'No response' });
    } finally {
        state.busy = false;
        syncChrome();
    }
}

const ctx = {
    state,
    money,
    toast,
    play,
    setBet,
    onResult(listener) {
        resultListeners.add(listener);
        return () => resultListeners.delete(listener);
    }
};

function buildNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = TABS.map(([id, label, path]) => `
        <button type="button" data-view="${id}">
            <svg viewBox="0 0 24 24"><path d="${path}"/></svg>
            <span>${label}</span>
        </button>
    `).join('');
    nav.addEventListener('click', (event) => {
        const button = event.target.closest('[data-view]');
        if (!button) return;
        state.view = button.dataset.view;
        renderView();
    });
}

function openTablet(payload = {}) {
    if (payload.player) state.player = payload.player;
    if (payload.config) state.config = payload.config;
    if (typeof payload.balance === 'number') state.balance = payload.balance;
    if (payload.stats) {
        state.stats = {
            wagered: payload.stats.wagered || 0,
            won: payload.stats.won || 0,
            lost: payload.stats.lost || 0,
            lastWin: payload.stats.lastWin || 0,
            history: payload.stats.history || []
        };
    }
    document.getElementById('overlay').classList.remove('hidden');
    renderView();
}

function closeTablet() {
    document.getElementById('overlay').classList.add('hidden');
    if (!preview) post('close');
}

buildNav();
document.getElementById('closeBtn').addEventListener('click', closeTablet);
window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.action === 'open') openTablet(data);
    if (data.action === 'close') document.getElementById('overlay').classList.add('hidden');
    if (data.action === 'result') applyResult(data.result);
});
window.addEventListener('keydown', (event) => {
    if (event.code === 'ShiftRight' || event.key === 'Escape') closeTablet();
});

if (preview) {
    document.body.classList.add('preview');
    state.player = { name: 'MoodyNewt8638', role: 'Admin' };
    openTablet();
}
