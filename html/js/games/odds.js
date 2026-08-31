import { dicePayout, minesMultiplier } from '../defaults.js';
import { head } from './ui.js';

export function render(root, ctx) {
    const cfg = ctx.state.config;
    const dice = dicePayout(cfg, 50);
    const mine = minesMultiplier(cfg, cfg.mines.defaultMines, 3);
    const wheel = cfg.wheel.segments.map((segment) => `${segment.label} ${segment.payout}x`).join(' · ');

    root.innerHTML = `
        ${head('Odds & payouts', 'These values are the live public config. Edit config.lua and restart the resource to change the house.')}
        <div class="odds-grid">
            <article class="panel">
                <h3>Blackjack</h3>
                <dl>
                    <dt>Blackjack payout</dt><dd>${cfg.blackjack.blackjackPayout}x</dd>
                    <dt>Dealer hits soft 17</dt><dd>${cfg.blackjack.dealerHitsSoft17 ? 'Yes' : 'No'}</dd>
                    <dt>Double / split</dt><dd>${cfg.blackjack.allowDouble ? 'On' : 'Off'} / ${cfg.blackjack.allowSplit ? 'On' : 'Off'}</dd>
                </dl>
            </article>
            <article class="panel">
                <h3>Roulette</h3>
                <dl>
                    <dt>Wheel</dt><dd>${cfg.roulette.type}</dd>
                    <dt>Straight</dt><dd>${cfg.roulette.payouts.straight}:1</dd>
                    <dt>Even money</dt><dd>${cfg.roulette.payouts.redblack}:1</dd>
                    <dt>Dozen / column</dt><dd>${cfg.roulette.payouts.dozen}:1</dd>
                </dl>
            </article>
            <article class="panel">
                <h3>Slots</h3>
                <dl>
                    ${cfg.slots.symbols.filter((item) => item.payouts && item.payouts[3]).map((item) => `<dt>${item.label}</dt><dd>3x ${item.payouts[3]} · 5x ${item.payouts[5]}</dd>`).join('')}
                </dl>
            </article>
            <article class="panel">
                <h3>Video poker</h3>
                <dl>
                    ${Object.entries(cfg.poker.paytable).map(([key, value]) => `<dt>${key}</dt><dd>${value}x</dd>`).join('')}
                </dl>
            </article>
            <article class="panel">
                <h3>Crash / dice / flip</h3>
                <dl>
                    <dt>Crash house edge</dt><dd>${(cfg.crash.houseEdge * 100).toFixed(1)}%</dd>
                    <dt>Dice 50% quote</dt><dd>${dice.payout.toFixed(2)}x</dd>
                    <dt>Coin win chance</dt><dd>${cfg.coinflip.winChance}%</dd>
                    <dt>Coin payout</dt><dd>${cfg.coinflip.payout}x</dd>
                </dl>
            </article>
            <article class="panel">
                <h3>Baccarat / wheel / mines</h3>
                <dl>
                    <dt>Player / banker / tie</dt><dd>${cfg.baccarat.playerPayout} / ${cfg.baccarat.bankerPayout} / ${cfg.baccarat.tiePayout}</dd>
                    <dt>Wheel pays</dt><dd>${wheel}</dd>
                    <dt>Mines default</dt><dd>${cfg.mines.defaultMines} mines</dd>
                    <dt>3 gems sample</dt><dd>${mine.toFixed(2)}x</dd>
                </dl>
            </article>
        </div>
    `;
}
