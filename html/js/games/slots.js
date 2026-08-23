import { bindRail, head, rail } from './ui.js';

let grid = null;
let hits = [];

export function render(root, ctx) {
    paint(root, ctx);
}

function cell(id) {
    const label = { seven: '7', diamond: 'DIA', star: '★', bell: 'BELL', bar: 'BAR', cherry: 'CHY' }[id] || id;
    return `<div class="sym ${id}">${label}</div>`;
}

function paint(root, ctx) {
    const symbols = ctx.state.config.slots.symbols;
    const display = grid || Array.from({ length: 3 }, () => symbols.map((item) => item.id).slice(0, 5));
    const reels = [0, 1, 2, 3, 4].map((reel) => `
        <div class="reel"><div class="reel-track">${[0, 1, 2].map((row) => cell(display[row][reel])).join('')}</div></div>
    `).join('');
    const table = symbols.map((item) => `<div>${item.label} · <b>3x ${item.payouts[3]}</b> / 5x ${item.payouts[5]}</div>`).join('');

    root.innerHTML = `
        <div class="game">
            ${head('Slots', 'Five reels, five paylines. Payouts come straight from Config.Slots.')}
            <div class="board">
                <div>
                    <div class="reels">${reels}</div>
                    <p class="hand-label">${hits.length ? hits.map((hit) => `Line ${hit.line}: ${hit.match} ${hit.symbol} +${ctx.money(hit.win)}`).join(' · ') : 'Spin to lock a result.'}</p>
                    <div class="paytable">${table}</div>
                </div>
            </div>
            ${rail(ctx, '<button class="cta red" data-play="spin">Spin</button>')}
        </div>
    `;

    bindRail(root, ctx, async () => {
        const result = await ctx.play('slots', { bet: ctx.state.bet });
        if (!result.ok) return;
        grid = result.result.grid;
        hits = result.result.hits || [];
        paint(root, ctx);
    });
}
