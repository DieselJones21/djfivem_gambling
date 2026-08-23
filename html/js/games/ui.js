export function cardNode(card) {
    if (!card || card.hidden) {
        return `<div class="playing-card back"><em>◆</em></div>`;
    }
    const red = card.suit === 'h' || card.suit === 'd';
    const suit = { s: '♠', h: '♥', d: '♦', c: '♣' }[card.suit] || '';
    return `<div class="playing-card ${red ? 'red' : ''}"><div><small>${card.rank}</small><em>${suit}</em></div></div>`;
}

export function rail(ctx, extras = '') {
    const presets = ctx.state.config.bets.presets.map((value) => (
        `<button type="button" data-preset="${value}" class="${ctx.state.bet === value ? 'on' : ''}">${ctx.money(value)}</button>`
    )).join('');

    return `
        <div class="rail">
            <div>
                <div class="presets">${presets}</div>
            </div>
            <div class="bet-box">
                <button class="icon-btn" data-bet="-">−</button>
                <strong>${ctx.money(ctx.state.bet)}</strong>
                <button class="icon-btn" data-bet="+">+</button>
                ${extras}
            </div>
        </div>
    `;
}

export function bindRail(root, ctx, onPlay) {
    root.querySelectorAll('[data-preset]').forEach((button) => {
        button.addEventListener('click', () => {
            ctx.setBet(Number(button.dataset.preset));
        });
    });
    root.querySelectorAll('[data-bet]').forEach((button) => {
        button.addEventListener('click', () => {
            const step = ctx.state.config.bets.presets[0] || 10;
            ctx.setBet(button.dataset.bet === '+' ? ctx.state.bet + step : ctx.state.bet - step);
        });
    });
    if (onPlay) {
        root.querySelectorAll('[data-play]').forEach((button) => {
            button.addEventListener('click', () => onPlay(button.dataset.play));
        });
    }
}

export function head(title, copy, extra = '') {
    return `
        <div class="view-head">
            <div>
                <h2>${title}</h2>
                <p>${copy}</p>
            </div>
            ${extra}
        </div>
    `;
}
