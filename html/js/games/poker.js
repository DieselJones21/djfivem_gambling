import { bindRail, cardNode, head, rail } from './ui.js';

let cards = [];
let held = [false, false, false, false, false];
let dealt = false;
let rank = null;

const NAMES = {
    royal: 'Royal flush',
    straightFlush: 'Straight flush',
    fours: 'Four of a kind',
    fullHouse: 'Full house',
    flush: 'Flush',
    straight: 'Straight',
    trips: 'Three of a kind',
    twoPair: 'Two pair',
    jacksOrBetter: 'Jacks or better',
    none: 'No hand'
};

export function render(root, ctx) {
    paint(root, ctx);
}

function paint(root, ctx) {
    const pay = Object.entries(ctx.state.config.poker.paytable)
        .map(([key, value]) => `<div>${NAMES[key] || key} · <b>${value}x</b></div>`)
        .join('');

    root.innerHTML = `
        <div class="game">
            ${head('Video poker', 'Jacks or Better. Hold anything you want, then draw.')}
            <div class="board">
                <div>
                    <div class="cards">
                        ${(cards.length ? cards : [null, null, null, null, null]).map((card, index) => `
                            <button type="button" data-hold="${index}" style="background:none;border:0;padding:0;cursor:pointer">
                                ${cardNode(card)}
                                <div class="hand-label">${held[index] ? 'HOLD' : ' '}</div>
                            </button>
                        `).join('')}
                    </div>
                    <p class="hand-label">${rank ? NAMES[rank] || rank : 'Deal five, then hold.'}</p>
                    <div class="paytable">${pay}</div>
                </div>
            </div>
            ${rail(ctx, dealt
                ? '<button class="cta" data-play="draw">Draw</button>'
                : '<button class="cta" data-play="deal">Deal</button>')}
        </div>
    `;

    root.querySelectorAll('[data-hold]').forEach((button) => {
        button.addEventListener('click', () => {
            if (!dealt) return;
            const index = Number(button.dataset.hold);
            held[index] = !held[index];
            paint(root, ctx);
        });
    });

    bindRail(root, ctx, async (action) => {
        if (action === 'deal') {
            const result = await ctx.play('poker_deal', { bet: ctx.state.bet });
            if (!result.ok) return;
            cards = result.cards;
            held = result.held;
            dealt = true;
            rank = null;
            paint(root, ctx);
            return;
        }
        const result = await ctx.play('poker_draw', { held });
        if (!result.ok) return;
        cards = result.cards;
        held = result.held;
        rank = result.rank;
        dealt = false;
        paint(root, ctx);
    });
}
