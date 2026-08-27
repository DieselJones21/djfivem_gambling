export const defaultConfig = {
    currency: { symbol: '$', locale: 'en-US' },
    bets: { min: 10, max: 100000, presets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000] },
    maxPayout: 250000,
    closeKey: 'RSHIFT',
    blackjack: {
        decks: 6,
        blackjackPayout: 1.2,
        dealerHitsSoft17: true,
        allowDouble: true,
        allowSplit: true
    },
    roulette: {
        type: 'american',
        payouts: { straight: 35, redblack: 1, evenodd: 1, highlow: 1, dozen: 2, column: 2 }
    },
    slots: {
        paylines: 3,
        symbols: [
            { id: 'seven', label: '7', weight: 2, payouts: { 3: 8, 4: 20, 5: 80 } },
            { id: 'diamond', label: 'DIA', weight: 4, payouts: { 3: 4, 4: 10, 5: 25 } },
            { id: 'star', label: 'STAR', weight: 6, payouts: { 3: 3, 4: 6, 5: 15 } },
            { id: 'bell', label: 'BELL', weight: 8, payouts: { 3: 2, 4: 4, 5: 8 } },
            { id: 'bar', label: 'BAR', weight: 10, payouts: { 3: 1, 4: 3, 5: 5 } },
            { id: 'cherry', label: 'CHERRY', weight: 14, payouts: { 3: 1, 4: 2, 5: 3 } },
            { id: 'blank', label: '', weight: 46, payouts: {} }
        ]
    },
    poker: {
        paytable: {
            royal: 250,
            straightFlush: 40,
            fours: 20,
            fullHouse: 6,
            flush: 5,
            straight: 3,
            trips: 2,
            twoPair: 1,
            jacksOrBetter: 1
        }
    },
    crash: { houseEdge: 0.12, maxMultiplier: 20, tickMs: 80 },
    dice: { houseEdgePercent: 8, minChance: 10, maxChance: 85 },
    baccarat: { playerPayout: 0.85, bankerPayout: 0.8, tiePayout: 8 },
    wheel: {
        segments: [
            { label: '0x', payout: 0, weight: 50, tone: 'dead' },
            { label: '1x', payout: 1, weight: 30, tone: 'mute' },
            { label: '2x', payout: 2, weight: 12, tone: 'white' },
            { label: '3x', payout: 3, weight: 5, tone: 'red' },
            { label: '5x', payout: 5, weight: 2, tone: 'white' },
            { label: '8x', payout: 8, weight: 1, tone: 'red' }
        ]
    },
    mines: { grid: 25, minMines: 3, maxMines: 20, defaultMines: 8, houseEdge: 0.12 },
    coinflip: { winChance: 43, payout: 2 }
};

export function dicePayout(config, chance) {
    const min = config.dice.minChance;
    const max = config.dice.maxChance;
    chance = Math.max(min, Math.min(max, Number(chance) || 50));
    return { chance, payout: Math.round(((100 - config.dice.houseEdgePercent) / chance) * 1000) / 1000 };
}

export function minesMultiplier(config, mines, revealed) {
    const cells = config.mines.grid;
    mines = Math.max(config.mines.minMines, Math.min(config.mines.maxMines, mines | 0));
    revealed = Math.max(0, Math.min(cells - mines, revealed | 0));
    if (!revealed) return 1;
    let multiplier = 1;
    for (let i = 0; i < revealed; i += 1) {
        multiplier *= (cells - i) / (cells - mines - i);
    }
    return Math.round(multiplier * (1 - config.mines.houseEdge) * 100) / 100;
}

export function wheelRtp(segments) {
    const total = segments.reduce((sum, item) => sum + item.weight, 0);
    const value = segments.reduce((sum, item) => sum + item.weight * item.payout, 0);
    return total ? value / total : 0;
}
