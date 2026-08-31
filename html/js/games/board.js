import { head } from './ui.js';

function column(title, rows, empty, ctx) {
    const body = rows.length
        ? rows.map((row) => `
            <li class="${row.self ? 'self' : ''}">
                <em>${row.rank}</em>
                <span>${row.name}</span>
                <b>${ctx.money(row.amount)}</b>
            </li>
        `).join('')
        : `<li class="empty">${empty}</li>`;

    return `
        <article class="panel board-col">
            <h3>${title}</h3>
            <ol class="board-list">${body}</ol>
        </article>
    `;
}

export function render(root, ctx) {
    const paint = () => {
        const board = ctx.state.leaderboard || { won: [], lost: [], mine: {} };
        const mine = board.mine || {};
        root.innerHTML = `
            ${head('Envy board', 'Lifetime profit and losses across every Envy tablet. Rankings persist on the server.')}
            <div class="board-grid">
                ${column('Most money won', board.won || [], 'No winners yet.', ctx)}
                ${column('Most money lost', board.lost || [], 'No losses recorded yet.', ctx)}
            </div>
            <div class="panel board-me">
                <span>Your tape</span>
                <strong>${mine.name || ctx.state.player.name}</strong>
                <p>
                    Won ${ctx.money(mine.won || 0)}${mine.wonRank ? ` · #${mine.wonRank}` : ''}
                    <em>Lost ${ctx.money(mine.lost || 0)}${mine.lostRank ? ` · #${mine.lostRank}` : ''}</em>
                </p>
            </div>
        `;
    };

    paint();
    return ctx.onResult((result) => {
        if (result && result.leaderboard) paint();
    });
}
