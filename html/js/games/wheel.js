import { bindRail, head, rail } from './ui.js';

let last = null;
let angle = 0;

export function render(root, ctx) {
    paint(root, ctx);
}

function paint(root, ctx) {
    const segments = ctx.state.config.wheel.segments;
    const slice = 360 / segments.length;
    const wedges = segments.map((segment, index) => {
        const color = segment.tone === 'red' ? '#e11d2e' : segment.tone === 'dead' ? '#3a3a44' : segment.tone === 'mute' ? '#1b1b21' : '#f5f5f5';
        const text = segment.tone === 'white' || segment.tone === 'mute' ? (segment.tone === 'white' ? '#111' : '#fff') : '#fff';
        return `<span style="transform: rotate(${index * slice}deg); color:${text}; background: conic-gradient(${color} 0 ${slice}deg, transparent ${slice}deg)">${segment.label}</span>`;
    }).join('');

    root.innerHTML = `
        <div class="game">
            ${head('Fortune wheel', 'Weighted segments from Config.Wheel. Center pin is the result.')}
            <div class="board">
                <div>
                    <div class="wheel-pin"></div>
                    <div class="wheel-game" id="wheel" style="transform: rotate(${angle}deg); background: #111">${wedges}</div>
                    <p class="hand-label">${last ? `Landed ${last.label} · paid ${ctx.money(last.payout)}` : 'Spin the wheel.'}</p>
                </div>
            </div>
            ${rail(ctx, '<button class="cta red" data-play="spin">Spin</button>')}
        </div>
    `;

    bindRail(root, ctx, async () => {
        const result = await ctx.play('wheel', { bet: ctx.state.bet });
        if (!result.ok) return;
        last = result.result;
        const sliceSize = 360 / segments.length;
        angle += 1260 + (segments.length - ((result.result.index - 1 + segments.length) % segments.length)) * sliceSize;
        paint(root, ctx);
    });
}
