import { head } from './ui.js';

let mode = 'money';
let amount = 100;

function coinLabel(ctx) {
    return ctx.state.config.memecoin?.label || 'Memecoin';
}

function cashier(ctx) {
    const cfg = ctx.state.config.memecoin || { enabled: true, rate: 1, presets: [10, 50, 100, 500, 1000], allowCashout: true };
    if (cfg.enabled === false) return '';
    const presets = (cfg.presets || []).map((value) => (
        `<button type="button" data-coin="${value}" class="${amount === value ? 'on' : ''}">${value.toLocaleString('en-US')}</button>`
    )).join('');
    const rate = cfg.rate || 1;
    const chipsOut = amount * rate;

    return `
        <div class="cashier">
            <div class="wallets">
                <article class="wallet">
                    <span>${coinLabel(ctx)}</span>
                    <strong>${Math.floor(ctx.state.memecoin || 0).toLocaleString('en-US')}</strong>
                    <em>crypto on hand</em>
                </article>
                <article class="wallet">
                    <span>House chips</span>
                    <strong>${ctx.money(ctx.state.balance)}</strong>
                    <em>${rate} chip${rate === 1 ? '' : 's'} per ${coinLabel(ctx).toLowerCase()}</em>
                </article>
            </div>
            <div class="panel convert">
                <div class="convert-head">
                    <h3>Memecoin cashier</h3>
                    <p>Convert crypto into chips to play every table on this tablet.</p>
                </div>
                <div class="presets">${presets}</div>
                <div class="convert-row">
                    <input id="convertAmount" type="number" min="${cfg.minConvert || 1}" max="${cfg.maxConvert || 50000}" value="${amount}" step="1">
                    <span>${amount} ${coinLabel(ctx)} → ${ctx.money(chipsOut)}</span>
                    <button class="cta" data-convert="buy" type="button">Buy chips</button>
                    ${cfg.allowCashout === false ? '' : `<button class="ghost" data-convert="cashout" type="button">Cash out ${ctx.money(chipsOut)}</button>`}
                </div>
            </div>
        </div>
    `;
}

export function render(root, ctx) {
    const history = ctx.state.stats.history || [];
    const pick = {
        money: (item) => item.profit,
        games: (item) => item.bet,
        wins: (item) => item.payout
    }[mode];
    const series = history.length ? history.slice(0, 8).reverse().map(pick) : [0, 0, 0];
    const max = Math.max(1, ...series.map((value) => Math.abs(value)));
    const width = 640;
    const height = 200;
    const pointList = series.map((value, index) => {
        const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width;
        const y = height - ((value + max) / (max * 2)) * (height - 16) - 8;
        return [x, y];
    });
    const points = pointList.map(([x, y]) => `${x},${y}`).join(' ');
    const area = `0,${height} ${points} ${width},${height}`;
    const labels = history.slice(0, 8).reverse().map((item) => item.game.slice(0, 3).toUpperCase());
    const rows = history.slice(0, 8).map((item) => `
        <li>
            <span>${item.game}</span>
            <b class="${item.profit >= 0 ? 'up' : 'down'}">${item.profit >= 0 ? '+' : ''}${ctx.money(item.profit)}</b>
            <em>${ctx.money(item.bet || 0)}</em>
        </li>
    `).join('') || '<li class="empty">No hands yet. Convert memecoin, then open a table.</li>';

    root.innerHTML = `
        ${head('Statistics overview', 'Live City of Dreams session tape. Convert memecoin into chips, then grind the house.', `
            <div class="toggles">
                <button class="toggle ${mode === 'money' ? 'on' : ''}" data-mode="money" type="button">Money</button>
                <button class="toggle ${mode === 'games' ? 'on' : ''}" data-mode="games" type="button">Games</button>
                <button class="toggle ${mode === 'wins' ? 'on' : ''}" data-mode="wins" type="button">Wins</button>
            </div>
        `)}
        ${cashier(ctx)}
        <div class="dash">
            <div class="panel">
                <div class="chart">
                    <div class="chart-y">
                        <span>${ctx.money(max)}</span>
                        <span>${ctx.money(0)}</span>
                        <span>−${ctx.money(max)}</span>
                    </div>
                    <div>
                        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="tape" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stop-color="#00e5f0"/>
                                    <stop offset="100%" stop-color="#ff2bd6"/>
                                </linearGradient>
                                <linearGradient id="tapeFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#ff2bd6" stop-opacity="0.32"/>
                                    <stop offset="100%" stop-color="#00e5f0" stop-opacity="0"/>
                                </linearGradient>
                            </defs>
                            <line x1="0" y1="${height - 8}" x2="${width}" y2="${height - 8}" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
                            <polygon fill="url(#tapeFill)" points="${area}"/>
                            <polyline fill="none" stroke="url(#tape)" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" points="${points}"/>
                            ${pointList.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="#ff2bd6" stroke-width="2"/>`).join('')}
                        </svg>
                        <div class="chart-x">${(labels.length ? labels : ['—']).map((label) => `<span>${label}</span>`).join('')}</div>
                    </div>
                </div>
            </div>
            <div class="panel">
                <div class="activity-head">
                    <span>Item</span>
                    <span>RC</span>
                    <span>Bet</span>
                </div>
                <ul class="history">${rows}</ul>
            </div>
        </div>
    `;

    root.querySelectorAll('[data-mode]').forEach((button) => {
        button.addEventListener('click', () => {
            mode = button.dataset.mode;
            render(root, ctx);
        });
    });

    const input = root.querySelector('#convertAmount');
    if (input) {
        input.addEventListener('input', (event) => {
            amount = Math.max(1, Math.floor(Number(event.target.value) || 0));
            const label = root.querySelector('.convert-row span');
            const rate = ctx.state.config.memecoin?.rate || 1;
            if (label) label.textContent = `${amount} ${coinLabel(ctx)} → ${ctx.money(amount * rate)}`;
        });
    }
    root.querySelectorAll('[data-coin]').forEach((button) => {
        button.addEventListener('click', () => {
            amount = Number(button.dataset.coin);
            render(root, ctx);
        });
    });
    root.querySelectorAll('[data-convert]').forEach((button) => {
        button.addEventListener('click', async () => {
            const live = Number(root.querySelector('#convertAmount')?.value || amount);
            amount = Math.max(1, Math.floor(live));
            const direction = button.dataset.convert;
            const payload = direction === 'cashout'
                ? amount * (ctx.state.config.memecoin?.rate || 1)
                : amount;
            const result = await ctx.convert(direction, payload);
            if (result && result.ok) render(root, ctx);
        });
    });
}
