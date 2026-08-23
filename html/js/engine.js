import { dicePayout, minesMultiplier } from './defaults.js';

const SUITS = ['s', 'h', 'd', 'c'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

let session = null;

function clampBet(config, amount) {
    const value = Math.floor(Number(amount) || 0);
    if (value < config.bets.min) return [null, 'Bet is below the table minimum'];
    if (value > config.bets.max) return [null, 'Bet is above the table maximum'];
    return [value, null];
}

function take(state, amount) {
    const [bet, error] = clampBet(state.config, amount);
    if (error) return [null, error];
    if (state.balance < bet) return [null, 'Not enough chips'];
    state.balance -= bet;
    return [bet, null];
}

function history(state, game, bet, payout) {
    state.stats.wagered += bet;
    state.stats.won += payout;
    if (payout > bet) state.stats.lastWin = payout - bet;
    if (payout === 0) state.stats.lost += bet;
    state.stats.history.unshift({ game, bet, payout, profit: payout - bet, at: Date.now() / 1000 });
    state.stats.history = state.stats.history.slice(0, 14);
}

function payload(state, extra = {}) {
    return {
        ok: true,
        balance: state.balance,
        stats: { ...state.stats, history: state.stats.history.slice() },
        ...extra
    };
}

function settle(state, game, bet, payout, extra = {}) {
    if (payout > 0) state.balance += payout;
    history(state, game, bet, payout);
    return payload(state, { game, bet, payout, profit: payout - bet, ...extra });
}

function shuffle(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function shoe(decks) {
    const cards = [];
    for (let d = 0; d < decks; d += 1) {
        for (const suit of SUITS) {
            for (const rank of RANKS) cards.push({ rank, suit });
        }
    }
    return shuffle(cards);
}

function draw(deck) {
    return deck.pop();
}

function rankValue(rank) {
    if (rank === 'A') return 11;
    if ('KQJ'.includes(rank)) return 10;
    return Number(rank);
}

function bjTotal(cards) {
    let total = 0;
    let aces = 0;
    for (const card of cards) {
        total += rankValue(card.rank);
        if (card.rank === 'A') aces += 1;
    }
    while (total > 21 && aces) {
        total -= 10;
        aces -= 1;
    }
    return total;
}

function isBj(cards) {
    return cards.length === 2 && bjTotal(cards) === 21;
}

function bjPublic(game) {
    const dealer = game.dealer.map((card) => ({ ...card }));
    if (!game.done) dealer[1] = { hidden: true };
    return {
        hands: game.player.map((cards, i) => ({
            cards: cards.map((card) => ({ ...card })),
            total: bjTotal(cards),
            doubled: Boolean(game.doubled[i])
        })),
        dealer,
        dealerTotal: game.done ? bjTotal(game.dealer) : null,
        active: game.active,
        done: game.done,
        payout: game.payout,
        canDouble: !game.done && game.player[game.active - 1].length === 2,
        canSplit: !game.done
            && game.player.length < 2
            && game.player[game.active - 1].length === 2
            && rankValue(game.player[game.active - 1][0].rank) === rankValue(game.player[game.active - 1][1].rank)
    };
}

function playDealer(game, hitsSoft17) {
    while (true) {
        const total = bjTotal(game.dealer);
        const soft = game.dealer.some((card) => card.rank === 'A') && total <= 21;
        if (total < 17 || (total === 17 && soft && hitsSoft17)) game.dealer.push(draw(game.shoe));
        else break;
    }
}

function weighted(entries) {
    const total = entries.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * total;
    for (let i = 0; i < entries.length; i += 1) {
        cursor -= entries[i].weight;
        if (cursor <= 0) return [entries[i], i];
    }
    return [entries[entries.length - 1], entries.length - 1];
}

function pokerValue(rank) {
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return Number(rank);
}

function pokerRank(cards, paytable) {
    const ranks = {};
    const suits = {};
    const values = cards.map((card) => {
        const value = pokerValue(card.rank);
        ranks[value] = (ranks[value] || 0) + 1;
        suits[card.suit] = (suits[card.suit] || 0) + 1;
        return value;
    }).sort((a, b) => a - b);

    const flush = Object.values(suits).some((count) => count === 5);
    const unique = [...new Set(values)];
    const wheel = unique.join(',') === '2,3,4,5,14';
    const straight = unique.length === 5 && (wheel || unique[4] - unique[0] === 4);
    const counts = Object.values(ranks).sort((a, b) => a - b);
    let highPair = 0;
    for (const [value, count] of Object.entries(ranks)) {
        if (count === 2) highPair = Math.max(highPair, Number(value));
    }

    if (straight && flush && values[0] === 10) return ['royal', paytable.royal];
    if (straight && flush) return ['straightFlush', paytable.straightFlush];
    if (counts[counts.length - 1] === 4) return ['fours', paytable.fours];
    if (counts[0] === 2 && counts[1] === 3) return ['fullHouse', paytable.fullHouse];
    if (flush) return ['flush', paytable.flush];
    if (straight) return ['straight', paytable.straight];
    if (counts[counts.length - 1] === 3) return ['trips', paytable.trips];
    if (counts[0] === 2 && counts[1] === 2) return ['twoPair', paytable.twoPair];
    if (counts[counts.length - 1] === 2 && highPair >= 11) return ['jacksOrBetter', paytable.jacksOrBetter];
    return ['none', 0];
}

function baccaratTotal(cards) {
    return cards.reduce((sum, card) => {
        let value = rankValue(card.rank);
        if (value === 11) value = 1;
        if (value === 10) value = 0;
        return sum + value;
    }, 0) % 10;
}

function fail(error) {
    return { ok: false, error };
}

const actions = {
    blackjack_deal(state, data) {
        if (session) return fail('Finish the current round first');
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        const cfg = state.config.blackjack;
        const game = {
            kind: 'blackjack',
            bet,
            shoe: shoe(cfg.decks),
            player: [],
            dealer: [],
            doubled: [false],
            active: 1,
            done: false
        };
        game.player[0] = [draw(game.shoe), draw(game.shoe)];
        game.dealer = [draw(game.shoe), draw(game.shoe)];
        if (isBj(game.player[0]) || isBj(game.dealer)) {
            game.done = true;
            if (isBj(game.player[0]) && isBj(game.dealer)) game.payout = bet;
            else if (isBj(game.player[0])) game.payout = Math.floor(bet + bet * cfg.blackjackPayout);
            else game.payout = 0;
            return settle(state, 'blackjack', bet, game.payout, { table: bjPublic(game) });
        }
        session = game;
        return payload(state, { table: bjPublic(game), reserved: bet });
    },

    blackjack_act(state, data) {
        if (!session || session.kind !== 'blackjack') return fail('No blackjack round is open');
        const hand = session.player[session.active - 1];
        if (data.action === 'hit' && bjTotal(hand) < 21) {
            hand.push(draw(session.shoe));
            if (bjTotal(hand) < 21) return payload(state, { table: bjPublic(session) });
        }
        if (data.action === 'double') {
            if (hand.length !== 2) return fail('Double is not available');
            const [extra, error] = take(state, session.bet);
            if (error) return fail(error);
            session.doubled[session.active - 1] = true;
            hand.push(draw(session.shoe));
        }
        if (data.action === 'split') {
            if (hand.length !== 2 || rankValue(hand[0].rank) !== rankValue(hand[1].rank)) {
                return fail('Cards cannot be split');
            }
            const [extra, error] = take(state, session.bet);
            if (error) return fail(error);
            const second = [hand.pop(), draw(session.shoe)];
            hand.push(draw(session.shoe));
            session.player.push(second);
            session.doubled.push(false);
            return payload(state, { table: bjPublic(session) });
        }

        if (session.active < session.player.length) {
            session.active += 1;
            return payload(state, { table: bjPublic(session) });
        }

        playDealer(session, state.config.blackjack.dealerHitsSoft17);
        session.done = true;
        const dealerTotal = bjTotal(session.dealer);
        let payout = 0;
        let totalBet = 0;
        session.player.forEach((cards, i) => {
            const wager = session.doubled[i] ? session.bet * 2 : session.bet;
            totalBet += wager;
            const playerTotal = bjTotal(cards);
            if (playerTotal <= 21) {
                if (dealerTotal > 21 || playerTotal > dealerTotal) payout += wager * 2;
                else if (playerTotal === dealerTotal) payout += wager;
            }
        });
        const table = bjPublic(session);
        session = null;
        return settle(state, 'blackjack', totalBet, payout, { table });
    },

    roulette(state, data) {
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        const pockets = ['0'];
        for (let i = 1; i <= 36; i += 1) pockets.push(String(i));
        if (state.config.roulette.type === 'american') pockets.push('00');
        const pocket = pockets[Math.floor(Math.random() * pockets.length)];
        const number = Number(pocket);
        const placement = data.placement || {};
        let won = false;
        let odd = 0;
        if (placement.kind === 'straight') {
            won = String(placement.value) === pocket;
            odd = state.config.roulette.payouts.straight;
        } else if (placement.kind === 'red' || placement.kind === 'black') {
            won = Number.isFinite(number) && ((placement.kind === 'red') === RED.has(number));
            odd = state.config.roulette.payouts.redblack;
        } else if (placement.kind === 'even' || placement.kind === 'odd') {
            won = Number.isFinite(number) && ((number % 2 === 0) === (placement.kind === 'even'));
            odd = state.config.roulette.payouts.evenodd;
        } else if (placement.kind === 'low' || placement.kind === 'high') {
            won = Number.isFinite(number) && (placement.kind === 'low' ? number <= 18 : number >= 19);
            odd = state.config.roulette.payouts.highlow;
        } else if (placement.kind === 'dozen') {
            won = Number.isFinite(number) && number >= (placement.value - 1) * 12 + 1 && number <= placement.value * 12;
            odd = state.config.roulette.payouts.dozen;
        } else if (placement.kind === 'column') {
            won = Number.isFinite(number) && ((number - 1) % 3) + 1 === placement.value;
            odd = state.config.roulette.payouts.column;
        }
        const payout = won ? Math.floor(bet + bet * odd) : 0;
        return settle(state, 'roulette', bet, payout, {
            result: { pocket, color: Number.isFinite(number) ? (RED.has(number) ? 'red' : 'black') : 'green', won, payout }
        });
    },

    slots(state, data) {
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        const symbols = state.config.slots.symbols;
        const grid = [[], [], []];
        for (let row = 0; row < 3; row += 1) {
            for (let reel = 0; reel < 5; reel += 1) {
                grid[row][reel] = weighted(symbols)[0].id;
            }
        }
        const lines = [
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [2, 2, 2, 2, 2],
            [0, 1, 2, 1, 0],
            [2, 1, 0, 1, 2]
        ];
        let payout = 0;
        const hits = [];
        lines.forEach((line, lineIndex) => {
            const first = grid[line[0]][0];
            let match = 1;
            for (let reel = 1; reel < 5; reel += 1) {
                if (grid[line[reel]][reel] === first) match += 1;
                else break;
            }
            const symbol = symbols.find((item) => item.id === first);
            const odd = symbol && symbol.payouts[match];
            if (match >= 3 && odd) {
                const win = Math.floor(bet * odd);
                payout += win;
                hits.push({ line: lineIndex + 1, symbol: first, match, win });
            }
        });
        return settle(state, 'slots', bet, payout, { result: { grid, hits, payout } });
    },

    poker_deal(state, data) {
        if (session) return fail('Finish the current round first');
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        session = { kind: 'poker', bet, shoe: shoe(1), cards: [], held: [false, false, false, false, false] };
        for (let i = 0; i < 5; i += 1) session.cards.push(draw(session.shoe));
        return payload(state, { cards: session.cards.map((card) => ({ ...card })), held: session.held.slice() });
    },

    poker_draw(state, data) {
        if (!session || session.kind !== 'poker') return fail('No poker round is open');
        const held = data.held || [];
        for (let i = 0; i < 5; i += 1) {
            session.held[i] = held[i] === true;
            if (!session.held[i]) session.cards[i] = draw(session.shoe);
        }
        const [rank, odd] = pokerRank(session.cards, state.config.poker.paytable);
        const payout = odd > 0 ? Math.floor(session.bet * odd) : 0;
        const result = settle(state, 'poker', session.bet, payout, {
            cards: session.cards.map((card) => ({ ...card })),
            held: session.held.slice(),
            rank
        });
        session = null;
        return result;
    },

    crash_start(state, data) {
        if (session) return fail('Finish the current round first');
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        const edge = state.config.crash.houseEdge;
        let crash = 1;
        if (Math.random() >= 0.03) {
            crash = Math.min(state.config.crash.maxMultiplier, (1 - edge) / Math.max(0.0001, 1 - Math.random()));
            crash = Math.round(crash * 100) / 100;
        }
        session = { kind: 'crash', bet, crash, started: performance.now() };
        return payload(state, { started: true, crash, growth: 0.065, tickMs: state.config.crash.tickMs, maxMultiplier: state.config.crash.maxMultiplier });
    },

    crash_cashout(state) {
        if (!session || session.kind !== 'crash') return fail('No crash round is open');
        const elapsed = (performance.now() - session.started) / 1000;
        const current = Math.round(Math.exp(0.065 * elapsed) * 100) / 100;
        const busted = current >= session.crash;
        const payout = busted ? 0 : Math.floor(session.bet * Math.min(current, session.crash - 0.01));
        const result = settle(state, 'crash', session.bet, payout, { crash: session.crash, cashed: current, busted });
        session = null;
        return result;
    },

    crash_bust(state) {
        if (!session || session.kind !== 'crash') return fail('No crash round is open');
        const result = settle(state, 'crash', session.bet, 0, { crash: session.crash, busted: true });
        session = null;
        return result;
    },

    dice(state, data) {
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        const { chance, payout } = dicePayout(state.config, data.chance);
        const roll = 1 + Math.floor(Math.random() * 100);
        const target = data.target === 'over' ? 'over' : 'under';
        const won = target === 'over' ? roll > (100 - chance) : roll <= chance;
        return settle(state, 'dice', bet, won ? Math.floor(bet * payout) : 0, {
            result: { roll, chance, target, won, payout: won ? Math.floor(bet * payout) : 0 }
        });
    },

    baccarat(state, data) {
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        const side = data.side;
        if (!['player', 'banker', 'tie'].includes(side)) return fail('Choose player, banker, or tie');
        const deck = shoe(8);
        const player = [draw(deck), draw(deck)];
        const banker = [draw(deck), draw(deck)];
        let playerTotal = baccaratTotal(player);
        let bankerTotal = baccaratTotal(banker);
        if (playerTotal < 8 && bankerTotal < 8) {
            if (playerTotal <= 5) player.push(draw(deck));
            playerTotal = baccaratTotal(player);
            let third = player[2] ? rankValue(player[2].rank) : null;
            if (third === 11) third = 1;
            if (third === 10) third = 0;
            let drawBanker = false;
            if (!player[2]) drawBanker = bankerTotal <= 5;
            else if (bankerTotal <= 2) drawBanker = true;
            else if (bankerTotal === 3) drawBanker = third !== 8;
            else if (bankerTotal === 4) drawBanker = third >= 2 && third <= 7;
            else if (bankerTotal === 5) drawBanker = third >= 4 && third <= 7;
            else if (bankerTotal === 6) drawBanker = third === 6 || third === 7;
            if (drawBanker) banker.push(draw(deck));
            bankerTotal = baccaratTotal(banker);
        }
        const winner = playerTotal === bankerTotal ? 'tie' : playerTotal > bankerTotal ? 'player' : 'banker';
        let payout = 0;
        if (side === winner) {
            const odd = state.config.baccarat[`${winner}Payout`];
            payout = Math.floor(bet + bet * odd);
        } else if (winner === 'tie') {
            payout = bet;
        }
        return settle(state, 'baccarat', bet, payout, {
            result: { player, banker, playerTotal, bankerTotal, winner, side, payout }
        });
    },

    wheel(state, data) {
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        const [segment, index] = weighted(state.config.wheel.segments);
        const payout = Math.floor(bet * segment.payout);
        return settle(state, 'wheel', bet, payout, {
            result: { index: index + 1, label: segment.label, multiplier: segment.payout, payout }
        });
    },

    mines_start(state, data) {
        if (session) return fail('Finish the current round first');
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        const mines = Math.max(state.config.mines.minMines, Math.min(state.config.mines.maxMines, Number(data.mines) || state.config.mines.defaultMines));
        const bombs = new Set();
        while (bombs.size < mines) bombs.add(1 + Math.floor(Math.random() * state.config.mines.grid));
        session = { kind: 'mines', bet, mines, bombs, revealed: {} };
        return payload(state, { board: publicMines(state, session), reserved: bet });
    },

    mines_reveal(state, data) {
        if (!session || session.kind !== 'mines') return fail('No mines round is open');
        const index = Number(data.index);
        if (session.revealed[index]) return fail('Tile already revealed');
        if (session.bombs.has(index)) {
            session.revealed[index] = 'mine';
            const result = settle(state, 'mines', session.bet, 0, { board: publicMines(state, session, true), payout: 0 });
            session = null;
            return result;
        }
        session.revealed[index] = 'gem';
        const count = Object.keys(session.revealed).length;
        session.multiplier = minesMultiplier(state.config, session.mines, count);
        session.cashout = Math.floor(session.bet * session.multiplier);
        if (count >= state.config.mines.grid - session.mines) {
            const result = settle(state, 'mines', session.bet, session.cashout, { board: publicMines(state, session, true) });
            session = null;
            return result;
        }
        return payload(state, { board: publicMines(state, session) });
    },

    mines_cashout(state) {
        if (!session || session.kind !== 'mines') return fail('No mines round is open');
        if (!Object.keys(session.revealed).length) return fail('Reveal a tile first');
        const result = settle(state, 'mines', session.bet, session.cashout || 0, { board: publicMines(state, session, true) });
        session = null;
        return result;
    },

    coinflip(state, data) {
        const [bet, error] = take(state, data.bet);
        if (error) return fail(error);
        if (data.side !== 'heads' && data.side !== 'tails') return fail('Choose heads or tails');
        const won = Math.random() * 100 < state.config.coinflip.winChance;
        const face = won ? data.side : data.side === 'heads' ? 'tails' : 'heads';
        const payout = won ? Math.floor(bet * state.config.coinflip.payout) : 0;
        return settle(state, 'coinflip', bet, payout, { result: { face, won, payout } });
    }
};

function publicMines(state, game, revealAll = false) {
    const tiles = [];
    for (let i = 1; i <= state.config.mines.grid; i += 1) {
        if (revealAll) tiles[i - 1] = game.bombs.has(i) ? 'mine' : (game.revealed[i] || 'gem');
        else tiles[i - 1] = game.revealed[i] || 'hidden';
    }
    return {
        tiles,
        mines: game.mines,
        multiplier: game.multiplier || 1,
        cashout: game.cashout || 0,
        done: revealAll,
        payout: game.payout || 0
    };
}

export function play(action, data, state) {
    const handler = actions[action];
    if (!handler) return fail('Unknown action');
    return handler(state, data || {});
}

export function resetSession() {
    session = null;
}
