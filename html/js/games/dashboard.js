import { head } from './ui.js';

let mode = 'money';

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
    `).join('') || '<li class="empty">No hands yet. Open a table to start the session tape.</li>';

    root.innerHTML = `
        ${head('Statistics overview', 'Live session tape across every table on this tablet.', `
            <div class="toggles">
                <button class="toggle ${mode === 'money' ? 'on' : ''}" data-mode="money" type="button">Money</button>
                <button class="toggle ${mode === 'games' ? 'on' : ''}" data-mode="games" type="button">Games</button>
                <button class="toggle ${mode === 'wins' ? 'on' : ''}" data-mode="wins" type="button">Wins</button>
            </div>
        `)}
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
                                    <stop offset="0%" stop-color="#e31c3d"/>
                                    <stop offset="100%" stop-color="#ff7a3c"/>
                                </linearGradient>
                                <linearGradient id="tapeFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#e31c3d" stop-opacity="0.28"/>
                                    <stop offset="100%" stop-color="#e31c3d" stop-opacity="0"/>
                                </linearGradient>
                            </defs>
                            <line x1="0" y1="${height - 8}" x2="${width}" y2="${height - 8}" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
                            <polygon fill="url(#tapeFill)" points="${area}"/>
                            <polyline fill="none" stroke="url(#tape)" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" points="${points}"/>
                            ${pointList.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="#e31c3d" stroke-width="2"/>`).join('')}
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
}
