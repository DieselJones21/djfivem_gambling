export const defaultConfig = {
    currency: { symbol: '$', locale: 'en-US' },
    bets: { min: 10, max: 25000, presets: [10, 50, 100, 250, 500, 1000, 2500, 5000] },
    closeKey: 'RSHIFT',
    blackjack: {
        decks: 6,
        blackjackPayout: 1.5,
        dealerHitsSoft17: false,
        allowDouble: true,
        allowSplit: true
    },
    roulette: {
        type: 'european',
        payouts: { straight: 35, redblack: 1, evenodd: 1, highlow: 1, dozen: 2, column: 2 }
    },
    slots: {
        symbols: [
            { id: 'seven', label: '7', weight: 4, payouts: { 3: 15, 4: 50, 5: 250 } },
            { id: 'diamond', label: 'DIA', weight: 8, payouts: { 3: 8, 4: 25, 5: 80 } },
            { id: 'star', label: 'STAR', weight: 12, payouts: { 3: 5, 4: 12, 5: 40 } },
            { id: 'bell', label: 'BELL', weight: 16, payouts: { 3: 3, 4: 8, 5: 20 } },
            { id: 'bar', label: 'BAR', weight: 20, payouts: { 3: 2, 4: 5, 5: 12 } },
            { id: 'cherry', label: 'CHERRY', weight: 26, payouts: { 3: 1, 4: 3, 5: 8 } }
        ]
    },
    poker: {
        paytable: {
            royal: 800,
            straightFlush: 50,
            fours: 25,
            fullHouse: 9,
            flush: 6,
            straight: 4,
            trips: 3,
            twoPair: 2,
            jacksOrBetter: 1
        }
    },
    crash: { houseEdge: 0.04, maxMultiplier: 100, tickMs: 80 },
    dice: { houseEdgePercent: 2, minChance: 2, maxChance: 98 },
    baccarat: { playerPayout: 1, bankerPayout: 0.95, tiePayout: 8 },
    wheel: {
        segments: [
            { label: '1x', payout: 1, weight: 28, tone: 'mute' },
            { label: '2x', payout: 2, weight: 22, tone: 'white' },
            { label: '3x', payout: 3, weight: 16, tone: 'red' },
            { label: '5x', payout: 5, weight: 12, tone: 'white' },
            { label: '8x', payout: 8, weight: 8, tone: 'red' },
            { label: '15x', payout: 15, weight: 6, tone: 'white' },
            { label: '25x', payout: 25, weight: 5, tone: 'red' },
            { label: '50x', payout: 50, weight: 2, tone: 'white' },
            { label: '0x', payout: 0, weight: 1, tone: 'dead' }
        ]
    },
    mines: { grid: 25, minMines: 1, maxMines: 20, defaultMines: 5, houseEdge: 0.03 },
    coinflip: { winChance: 48, payout: 2 }
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
