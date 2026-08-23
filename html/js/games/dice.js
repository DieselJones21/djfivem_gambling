import { dicePayout } from '../defaults.js';
import { bindRail, head, rail } from './ui.js';

let chance = 50;
let target = 'under';
let last = null;

export function render(root, ctx) {
    paint(root, ctx);
}

function paint(root, ctx) {
    const quote = dicePayout(ctx.state.config, chance);
    root.innerHTML = `
        <div class="game">
            ${head('Dice', `Payout is (100 − ${ctx.state.config.dice.houseEdgePercent}% house) / win chance.`)}
            <div class="board">
                <div class="dice-wrap">
                    <div class="die">${last ? last.roll : '--'}</div>
                    <div class="toggles">
                        <button class="toggle ${target === 'under' ? 'on' : ''}" data-target="under">Roll under</button>
                        <button class="toggle ${target === 'over' ? 'on' : ''}" data-target="over">Roll over</button>
                    </div>
                    <label class="slider">
                        <input id="chance" type="range" min="${ctx.state.config.dice.minChance}" max="${ctx.state.config.dice.maxChance}" value="${chance}">
                    </label>
                    <p class="hand-label">${quote.chance}% chance · ${quote.payout.toFixed(2)}x · ${last ? (last.won ? 'Hit' : 'Miss') : 'Set a chance and roll.'}</p>
                </div>
            </div>
            ${rail(ctx, '<button class="cta" data-play="roll">Roll</button>')}
        </div>
    `;

    root.querySelector('#chance').addEventListener('input', (event) => {
        chance = Number(event.target.value);
        const live = dicePayout(ctx.state.config, chance);
        root.querySelector('.hand-label').textContent = `${live.chance}% chance · ${live.payout.toFixed(2)}x · ${last ? (last.won ? 'Hit' : 'Miss') : 'Set a chance and roll.'}`;
    });
    root.querySelectorAll('[data-target]').forEach((button) => {
        button.addEventListener('click', () => {
            target = button.dataset.target;
            paint(root, ctx);
        });
    });
    bindRail(root, ctx, async () => {
        const result = await ctx.play('dice', { bet: ctx.state.bet, chance, target });
        if (!result.ok) return;
        last = result.result;
        paint(root, ctx);
    });
}
