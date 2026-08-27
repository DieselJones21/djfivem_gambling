import { defaultConfig, dicePayout, minesMultiplier, wheelRtp } from '../html/js/defaults.js';
import { play, resetSession } from '../html/js/engine.js';
import { emptyLeaderboard, recordLeaderboard, seedPreviewBoard } from '../html/js/leaderboard.js';

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
assert(fifty.payout === 1.84, `dice 50% payout should be 1.84, got ${fifty.payout}`);

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

app = state();
let sawLoss = false;
for (let i = 0; i < 40; i += 1) {
    const flip = play('coinflip', { bet: 10, side: 'heads' }, app);
    if (!flip.result.won) {
        assert(app.stats.lastWin === 0, 'a losing hand clears recent win');
        sawLoss = true;
        break;
    }
}
assert(sawLoss, 'expected a losing flip while checking recent-win reset');

const board = emptyLeaderboard('You');
recordLeaderboard(board, 'Vex', 500);
recordLeaderboard(board, 'Rook', 200);
recordLeaderboard(board, 'Rook', -900);
recordLeaderboard(board, 'You', 300);
assert(board.won[0].name === 'Vex' && board.won[0].amount === 500, 'top winner is highest profit');
assert(board.lost[0].name === 'Rook' && board.lost[0].amount === 900, 'top loser is highest loss');
assert(board.mine.won === 300 && board.mine.wonRank === 2, 'current player rank is tracked');

const seeded = seedPreviewBoard('MoodyNewt8638');
assert(seeded.won.length >= 3, 'preview board has sample winners');
assert(seeded.lost[0].amount > 0, 'preview board has sample losses');

resetSession();
app = state();
app.player = { name: 'Tester' };
for (let i = 0; i < 8; i += 1) play('coinflip', { bet: 10, side: 'heads' }, app);
assert(app.leaderboard.mine.won + app.leaderboard.mine.lost > 0, 'engine writes the house board');

resetSession();
app = state();
const crash = play('crash_start', { bet: 100 }, app);
assert(crash.ok && crash.started, crash.error);
const blocked = play('mines_start', { bet: 100, mines: 5 }, app);
assert(!blocked.ok, 'mines waits until crash is settled');
const cashed = play('crash_cashout', {}, app);
assert(cashed.ok, cashed.error);
resetSession();
app = state();
const after = play('mines_start', { bet: 100, mines: 5 }, app);
assert(after.ok && after.board.tiles.length === 25, after.error);

const tooBig = play('slots', { bet: 100001 }, state());
assert(!tooBig.ok, 'rejects bets over 100k');

const rtp = wheelRtp(defaultConfig.wheel.segments);
assert(rtp < 1, `wheel RTP must be house-sided, got ${rtp}`);
assert(defaultConfig.coinflip.winChance < 50, 'coin flip must be worse than even');
assert(defaultConfig.bets.max === 100000, 'max bet is 100k');

console.log('odds and engine checks passed');
