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
    const points = series.map((value, index) => {
        const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width;
        const y = height - ((value + max) / (max * 2)) * (height - 16) - 8;
        return `${x},${y}`;
    }).join(' ');
    const labels = history.slice(0, 8).reverse().map((item) => item.game.slice(0, 3).toUpperCase());
    const rows = history.slice(0, 6).map((item) => `
        <li>
            <span>${item.game}</span>
            <b class="${item.profit >= 0 ? 'up' : 'down'}">${item.profit >= 0 ? '+' : ''}${ctx.money(item.profit)}</b>
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
        <div class="panel">
            <div class="chart">
                <div class="chart-y">
                    <span>${ctx.money(max)}</span>
                    <span>${ctx.money(0)}</span>
                    <span>−${ctx.money(max)}</span>
                </div>
                <div>
                    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                        <line x1="0" y1="${height - 8}" x2="${width}" y2="${height - 8}" stroke="#fff" stroke-width="1"/>
                        <polyline fill="none" stroke="#fff" stroke-width="2" points="${points}"/>
                        ${points.split(' ').map((point) => {
                            const [x, y] = point.split(',');
                            return `<circle cx="${x}" cy="${y}" r="4" fill="#fff"/>`;
                        }).join('')}
                    </svg>
                    <div class="chart-x">${(labels.length ? labels : ['—']).map((label) => `<span>${label}</span>`).join('')}</div>
                </div>
            </div>
        </div>
        <ul class="history">${rows}</ul>
    `;

    root.querySelectorAll('[data-mode]').forEach((button) => {
        button.addEventListener('click', () => {
            mode = button.dataset.mode;
            render(root, ctx);
        });
    });
}
