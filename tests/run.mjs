import { defaultConfig, dicePayout, minesMultiplier } from '../html/js/defaults.js';
import { play, resetSession } from '../html/js/engine.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const state = () => ({
    balance: 10000,
    stats: { wagered: 0, won: 0, lost: 0, lastWin: 0, history: [] },
    config: structuredClone(defaultConfig)
});

const fifty = dicePayout(defaultConfig, 50);
assert(fifty.chance === 50, 'dice chance clamps to 50');
assert(fifty.payout === 1.96, `dice 50% payout should be 1.96, got ${fifty.payout}`);

const mine = minesMultiplier(defaultConfig, 5, 3);
assert(mine > 1, 'mines multiplier grows after gems');
assert(minesMultiplier(defaultConfig, 5, 0) === 1, 'mines starts at 1x');

resetSession();
let app = state();
const slots = play('slots', { bet: 100 }, app);
assert(slots.ok, slots.error);
assert(app.balance === 10000 - 100 + slots.payout, 'slots settles against balance');
assert(app.stats.history[0].game === 'slots', 'slots writes history');

app = state();
const flip = play('coinflip', { bet: 100, side: 'heads' }, app);
assert(flip.ok && (flip.result.face === 'heads' || flip.result.face === 'tails'), 'coinflip returns a face');
assert(flip.result.won ? app.balance === 10000 + 100 : app.balance === 9900, 'coinflip payout is 2x or zero');

app = state();
const dice = play('dice', { bet: 50, chance: 50, target: 'under' }, app);
assert(dice.result.roll >= 1 && dice.result.roll <= 100, 'dice roll in range');

app = state();
const wheel = play('wheel', { bet: 25 }, app);
assert(wheel.result.label, 'wheel lands on a labeled segment');

app = state();
const roulette = play('roulette', { bet: 10, placement: { kind: 'red' } }, app);
assert(['red', 'black', 'green'].includes(roulette.result.color), 'roulette color');

app = state();
const deal = play('blackjack_deal', { bet: 100 }, app);
assert(deal.ok, deal.error);
if (!deal.table.done) {
    const stood = play('blackjack_act', { action: 'stand' }, app);
    assert(stood.ok, stood.error);
    assert(stood.table.done, 'blackjack stand finishes the hand');
}

resetSession();
app = state();
const poker = play('poker_deal', { bet: 100 }, app);
assert(poker.cards.length === 5, 'poker deals five');
const draw = play('poker_draw', { held: [true, true, true, true, true] }, app);
assert(draw.ok, draw.error);
assert(draw.rank, 'poker ranks the held hand');

resetSession();
app = state();
const mines = play('mines_start', { bet: 100, mines: 5 }, app);
assert(mines.board.tiles.length === 25, 'mines grid size');
const safe = mines.board.tiles.findIndex((tile) => tile === 'hidden') + 1;
const reveal = play('mines_reveal', { index: safe }, app);
assert(reveal.ok, reveal.error);

app = state();
const baccarat = play('baccarat', { bet: 100, side: 'player' }, app);
assert(['player', 'banker', 'tie'].includes(baccarat.result.winner), 'baccarat winner');

const tooSmall = play('slots', { bet: 1 }, state());
assert(!tooSmall.ok, 'rejects bets under the table minimum');

console.log('odds and engine checks passed');
