import { bindRail, head, rail } from './ui.js';

let last = null;
let angle = 0;

const TONES = {
    red: '#ff3358',
    white: '#f4f4f6',
    mute: '#2a2a32',
    dead: '#111114'
};

export function render(root, ctx) {
    paint(root, ctx);
}

function paint(root, ctx) {
    const segments = ctx.state.config.wheel.segments;
    const slice = 360 / segments.length;
    const gradient = segments.map((segment, index) => {
        const color = TONES[segment.tone] || '#2a2a32';
        return `${color} ${index * slice}deg ${(index + 1) * slice}deg`;
    }).join(', ');
    const labels = segments.map((segment, index) => {
        const ink = segment.tone === 'white' ? '#111' : '#fff';
        return `<b style="transform: rotate(${index * slice + slice / 2}deg) translateY(-88px); color:${ink}">${segment.label}</b>`;
    }).join('');

    root.innerHTML = `
        <div class="game">
            ${head('Fortune wheel', 'Weighted segments from Config.Wheel. The pin at the top is the result.')}
            <div class="board">
                <div>
                    <div class="wheel-pin"></div>
                    <div class="wheel-game" id="wheel" style="transform: rotate(${angle}deg); background: conic-gradient(${gradient})">${labels}</div>
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
        const index = (result.result.index - 1 + segments.length) % segments.length;
        const target = 360 - (index * slice + slice / 2);
        angle = Math.ceil(angle / 360) * 360 + 1080 + target;
        paint(root, ctx);
    });
}
