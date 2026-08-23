import { bindRail, head, rail } from './ui.js';

let side = 'heads';
let last = null;

export function render(root, ctx) {
    paint(root, ctx);
}

function paint(root, ctx) {
    root.innerHTML = `
        <div class="game">
            ${head('Coin flip', `${ctx.state.config.coinflip.winChance}% win chance, ${ctx.state.config.coinflip.payout}x payout.`)}
            <div class="board">
                <div class="dice-wrap">
                    <div class="coin ${last ? 'flip' : ''}">${last ? last.face.toUpperCase() : 'READY'}</div>
                    <div class="toggles">
                        <button class="toggle ${side === 'heads' ? 'on' : ''}" data-side="heads">Heads</button>
                        <button class="toggle ${side === 'tails' ? 'on' : ''}" data-side="tails">Tails</button>
                    </div>
                    <p class="hand-label">${last ? (last.won ? 'You hit' : 'House took it') : 'Call it in the air.'}</p>
                </div>
            </div>
            ${rail(ctx, '<button class="cta" data-play="flip">Flip</button>')}
        </div>
    `;

    root.querySelectorAll('[data-side]').forEach((button) => {
        button.addEventListener('click', () => {
            side = button.dataset.side;
            paint(root, ctx);
        });
    });
    bindRail(root, ctx, async () => {
        const result = await ctx.play('coinflip', { bet: ctx.state.bet, side });
        if (!result.ok) return;
        last = result.result;
        paint(root, ctx);
    });
}
