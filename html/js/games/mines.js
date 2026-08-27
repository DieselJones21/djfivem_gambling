import { minesMultiplier } from '../defaults.js';
import { bindRail, head, rail } from './ui.js';

let board = null;
let mines = 5;

export function render(root, ctx) {
    mines = ctx.state.config.mines.defaultMines;
    paint(root, ctx);
}

function paint(root, ctx) {
    const tiles = board?.tiles || Array.from({ length: ctx.state.config.mines.grid }, () => 'hidden');
    const next = minesMultiplier(ctx.state.config, board?.mines || mines, (board?.tiles || []).filter((tile) => tile === 'gem').length);
    root.innerHTML = `
        <div class="game">
            ${head('Mines', `Multiplier uses a fair remaining-tile curve minus a ${(ctx.state.config.mines.houseEdge * 100).toFixed(0)}% house edge.`)}
            <div class="board">
                <div>
                    <div class="mines">
                        ${tiles.map((tile, index) => `<button class="tile ${tile}" data-tile="${index + 1}" ${!board || board.done || tile !== 'hidden' ? 'disabled' : ''}>${tile === 'hidden' ? '' : tile === 'mine' ? 'X' : '●'}</button>`).join('')}
                    </div>
                    <p class="hand-label">${board ? `${(board.multiplier || 1).toFixed(2)}x · cashout ${ctx.money(board.cashout || 0)}` : `${mines} mines · next gem ${next.toFixed(2)}x`}</p>
                </div>
            </div>
            ${rail(ctx, board && !board.done
                ? '<button class="cta" data-play="cash">Cash out</button>'
                : `
                    <input id="mines" type="range" min="${ctx.state.config.mines.minMines}" max="${ctx.state.config.mines.maxMines}" value="${mines}" style="width:120px;accent-color:#e31c3d">
                    <button class="cta red" data-play="start">Start</button>
                `)}
        </div>
    `;

    const slider = root.querySelector('#mines');
    if (slider) {
        slider.addEventListener('input', (event) => {
            mines = Number(event.target.value);
            const next = minesMultiplier(ctx.state.config, mines, 0);
            root.querySelector('.hand-label').textContent = `${mines} mines · start to lock the board`;
            void next;
        });
    }

    root.querySelectorAll('[data-tile]').forEach((button) => {
        button.addEventListener('click', async () => {
            const result = await ctx.play('mines_reveal', { index: Number(button.dataset.tile) });
            if (!result.ok) return;
            board = result.board;
            paint(root, ctx);
        });
    });

    bindRail(root, ctx, async (action) => {
        if (action === 'start') {
            const result = await ctx.play('mines_start', { bet: ctx.state.bet, mines });
            if (!result.ok) return;
            board = result.board;
            paint(root, ctx);
            return;
        }
        const result = await ctx.play('mines_cashout');
        if (!result.ok) return;
        board = result.board;
        paint(root, ctx);
    });
}
