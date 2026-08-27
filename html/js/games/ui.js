export function shortMoney(value, symbol = '$') {
    const n = Math.floor(Number(value) || 0);
    if (n >= 1000 && n % 1000 === 0) return `${symbol}${n / 1000}k`;
    if (n >= 1000) return `${symbol}${(n / 1000).toFixed(n % 100 === 0 ? 1 : 2)}k`;
    return `${symbol}${n.toLocaleString('en-US')}`;
}

export function cardNode(card) {
    if (!card || card.hidden) {
        return `<div class="playing-card back"><em>◆</em></div>`;
    }
    const red = card.suit === 'h' || card.suit === 'd';
    const suit = { s: '♠', h: '♥', d: '♦', c: '♣' }[card.suit] || '';
    return `<div class="playing-card ${red ? 'red' : ''}"><div><small>${card.rank}</small><em>${suit}</em></div></div>`;
}

export function rail(ctx, extras = '', locked = false) {
    const presets = ctx.state.config.bets.presets.map((value) => (
        `<button type="button" data-preset="${value}" class="${ctx.state.bet === value ? 'on' : ''}" ${locked ? 'disabled' : ''}>${shortMoney(value)}</button>`
    )).join('');

    return `
        <div class="rail">
            <div>
                <div class="presets">${presets}</div>
            </div>
            <div class="bet-box">
                <button class="icon-btn" data-bet="-" ${locked ? 'disabled' : ''}>−</button>
                <strong>${ctx.money(ctx.state.bet)}</strong>
                <button class="icon-btn" data-bet="+" ${locked ? 'disabled' : ''}>+</button>
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
            const presets = ctx.state.config.bets.presets;
            const current = ctx.state.bet;
            const idx = presets.findIndex((value) => value >= current);
            if (button.dataset.bet === '+') {
                const next = presets.find((value) => value > current);
                ctx.setBet(next || ctx.state.config.bets.max);
            } else {
                const prev = [...presets].reverse().find((value) => value < current);
                ctx.setBet(prev || ctx.state.config.bets.min);
            }
            void idx;
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
