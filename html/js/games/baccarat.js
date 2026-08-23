import { bindRail, cardNode, head, rail } from './ui.js';

let side = 'player';
let last = null;

export function render(root, ctx) {
    paint(root, ctx);
}

function paint(root, ctx) {
    const cfg = ctx.state.config.baccarat;
    root.innerHTML = `
        <div class="game">
            ${head('Baccarat', `Player ${cfg.playerPayout}x · Banker ${cfg.bankerPayout}x · Tie ${cfg.tiePayout}x. Ties push player/banker bets.`)}
            <div class="board">
                <div class="bj">
                    <div class="bj-row">
                        <div class="hand-label">Banker ${last ? `· ${last.bankerTotal}` : ''}</div>
                        <div class="cards">${last ? last.banker.map(cardNode).join('') : '<p class="empty">No cards yet.</p>'}</div>
                    </div>
                    <div class="bj-row">
                        <div class="hand-label">Player ${last ? `· ${last.playerTotal}` : ''}</div>
                        <div class="cards">${last ? last.player.map(cardNode).join('') : '<p class="empty">Pick a side and deal.</p>'}</div>
                    </div>
                    <div class="toggles">
                        <button class="toggle ${side === 'player' ? 'on' : ''}" data-side="player">Player</button>
                        <button class="toggle ${side === 'banker' ? 'on' : ''}" data-side="banker">Banker</button>
                        <button class="toggle ${side === 'tie' ? 'on' : ''}" data-side="tie">Tie</button>
                    </div>
                    <p class="hand-label">${last ? `Winner: ${last.winner}` : 'Standard baccarat tableau.'}</p>
                </div>
            </div>
            ${rail(ctx, '<button class="cta" data-play="deal">Deal</button>')}
        </div>
    `;

    root.querySelectorAll('[data-side]').forEach((button) => {
        button.addEventListener('click', () => {
            side = button.dataset.side;
            paint(root, ctx);
        });
    });
    bindRail(root, ctx, async () => {
        const result = await ctx.play('baccarat', { bet: ctx.state.bet, side });
        if (!result.ok) return;
        last = result.result;
        paint(root, ctx);
    });
}
