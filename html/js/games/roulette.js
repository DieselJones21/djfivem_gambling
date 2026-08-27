import { bindRail, head, rail } from './ui.js';

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
let placement = { kind: 'red', value: null };
let last = null;
let spin = 0;

export function render(root, ctx) {
    paint(root, ctx);
}

function paint(root, ctx) {
    const numbers = Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
        const selected = placement.kind === 'straight' && Number(placement.value) === n;
        return `<button type="button" class="${RED.has(n) ? 'red' : ''} ${selected ? 'on' : ''}" data-kind="straight" data-value="${n}">${n}</button>`;
    }).join('');

    root.innerHTML = `
        <div class="game">
            ${head('Roulette', `${ctx.state.config.roulette.type === 'american' ? 'American double-zero' : 'European single-zero'} wheel. Straight pays ${ctx.state.config.roulette.payouts.straight}:1.`)}
            <div class="board">
                <div class="roulette">
                    <div class="wheel-wrap">
                        <div class="wheel-pin"></div>
                        <div class="wheel" id="wheel" style="transform: rotate(${spin}deg)"></div>
                        <p class="hand-label">${last ? `Hit ${last.pocket} · ${last.color}` : 'Pick a bet, then spin.'}</p>
                    </div>
                    <div class="felt">
                        <div class="outers">
                            <button type="button" class="green ${placement.kind === 'straight' && String(placement.value) === '0' ? 'on' : ''}" data-kind="straight" data-value="0">0</button>
                            ${ctx.state.config.roulette.type === 'american' ? `<button type="button" class="green ${placement.kind === 'straight' && String(placement.value) === '00' ? 'on' : ''}" data-kind="straight" data-value="00">00</button>` : ''}
                            <button type="button" class="red ${placement.kind === 'red' ? 'on' : ''}" data-kind="red">Red</button>
                            <button type="button" class="${placement.kind === 'black' ? 'on' : ''}" data-kind="black">Black</button>
                            <button type="button" class="${placement.kind === 'even' ? 'on' : ''}" data-kind="even">Even</button>
                            <button type="button" class="${placement.kind === 'odd' ? 'on' : ''}" data-kind="odd">Odd</button>
                            <button type="button" class="${placement.kind === 'low' ? 'on' : ''}" data-kind="low">1-18</button>
                        </div>
                        <div class="numbers">${numbers}</div>
                        <div class="outers">
                            <button type="button" class="${placement.kind === 'high' ? 'on' : ''}" data-kind="high">19-36</button>
                            <button type="button" class="${placement.kind === 'dozen' && placement.value === 1 ? 'on' : ''}" data-kind="dozen" data-value="1">1st 12</button>
                            <button type="button" class="${placement.kind === 'dozen' && placement.value === 2 ? 'on' : ''}" data-kind="dozen" data-value="2">2nd 12</button>
                            <button type="button" class="${placement.kind === 'dozen' && placement.value === 3 ? 'on' : ''}" data-kind="dozen" data-value="3">3rd 12</button>
                            <button type="button" class="${placement.kind === 'column' && placement.value === 1 ? 'on' : ''}" data-kind="column" data-value="1">Col 1</button>
                            <button type="button" class="${placement.kind === 'column' && placement.value === 2 ? 'on' : ''}" data-kind="column" data-value="2">Col 2</button>
                            <button type="button" class="${placement.kind === 'column' && placement.value === 3 ? 'on' : ''}" data-kind="column" data-value="3">Col 3</button>
                        </div>
                    </div>
                </div>
            </div>
            ${rail(ctx, '<button class="cta" data-play="spin">Spin</button>')}
        </div>
    `;

    root.querySelectorAll('[data-kind]').forEach((button) => {
        button.addEventListener('click', () => {
            placement = {
                kind: button.dataset.kind,
                value: button.dataset.value === undefined ? null : (Number(button.dataset.value) || button.dataset.value)
            };
            paint(root, ctx);
        });
    });

    bindRail(root, ctx, async () => {
        const result = await ctx.play('roulette', { bet: ctx.state.bet, placement });
        if (!result.ok) return;
        last = result.result;
        spin += 1080 + Math.floor(Math.random() * 360);
        paint(root, ctx);
    });
}
