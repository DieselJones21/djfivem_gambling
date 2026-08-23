import { bindRail, cardNode, head, rail } from './ui.js';

let table = null;

export function render(root, ctx) {
    paint(root, ctx);
}

function paint(root, ctx) {
    const hands = table?.hands || [];
    const dealer = table?.dealer || [];
    root.innerHTML = `
        <div class="game">
            ${head('Blackjack', `Blackjack pays ${ctx.state.config.blackjack.blackjackPayout === 1.5 ? '3:2' : ctx.state.config.blackjack.blackjackPayout + 'x'}. Dealer stands on 17.`)}
            <div class="board">
                <div class="bj">
                    <div class="bj-row">
                        <div class="hand-label">Dealer ${table?.dealerTotal ? `· ${table.dealerTotal}` : ''}</div>
                        <div class="cards">${dealer.length ? dealer.map(cardNode).join('') : '<p class="empty">Deal a hand to start.</p>'}</div>
                    </div>
                    <div class="bj-row">
                        ${hands.map((hand, index) => `
                            <div>
                                <div class="hand-label">You · ${hand.total}${table.active === index + 1 && !table.done ? ' · live' : ''}</div>
                                <div class="cards">${hand.cards.map(cardNode).join('')}</div>
                            </div>
                        `).join('') || '<p class="empty">Place a bet, then deal.</p>'}
                    </div>
                </div>
            </div>
            ${rail(ctx, table && !table.done ? `
                <button class="ghost" data-act="hit">Hit</button>
                <button class="ghost" data-act="stand">Stand</button>
                <button class="ghost" data-act="double" ${table.canDouble ? '' : 'disabled'}>Double</button>
                <button class="ghost" data-act="split" ${table.canSplit ? '' : 'disabled'}>Split</button>
            ` : `<button class="cta" data-play="deal">Deal</button>`)}
        </div>
    `;

    bindRail(root, ctx, async () => {
        const result = await ctx.play('blackjack_deal', { bet: ctx.state.bet });
        if (result.ok) {
            table = result.table;
            paint(root, ctx);
        }
    });

    root.querySelectorAll('[data-act]').forEach((button) => {
        button.addEventListener('click', async () => {
            const result = await ctx.play('blackjack_act', { action: button.dataset.act });
            if (result.ok) {
                table = result.table;
                paint(root, ctx);
            }
        });
    });
}
