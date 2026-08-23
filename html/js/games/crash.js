import { bindRail, head, rail } from './ui.js';

let live = false;
let shown = 1;
let timer = 0;
let crashAt = 0;

export function render(root, ctx) {
    const stop = ctx.onResult((result) => {
        if (!result.busted && !result.cashed) return;
        window.clearInterval(timer);
        live = false;
        crashAt = result.crash || crashAt;
        shown = result.cashed || result.crash || shown;
        paint(root, ctx);
    });
    paint(root, ctx);
    return () => {
        window.clearInterval(timer);
        stop();
    };
}

function paint(root, ctx) {
    root.innerHTML = `
        <div class="game">
            ${head('Crash', `House edge ${(ctx.state.config.crash.houseEdge * 100).toFixed(1)}%. Cash out before the graph dies.`)}
            <div class="board">
                <div class="crash-stage">
                    <div class="crash-mult ${shown >= 2 ? 'hot' : ''}" id="mult">${shown.toFixed(2)}x</div>
                    <div class="crash-bar"><i id="bar" style="width:${Math.min(100, (shown / 10) * 100)}%"></i></div>
                    <p class="hand-label">${live ? 'Round live' : crashAt ? `Crashed at ${crashAt.toFixed(2)}x` : 'Start a round to ride the multiplier.'}</p>
                </div>
            </div>
            ${rail(ctx, live
                ? '<button class="cta red" data-play="out">Cash out</button>'
                : '<button class="cta" data-play="start">Start</button>')}
        </div>
    `;

    bindRail(root, ctx, async (action) => {
        if (action === 'start') {
            const result = await ctx.play('crash_start', { bet: ctx.state.bet });
            if (!result.ok) return;
            live = true;
            shown = 1;
            crashAt = result.crash || 0;
            const started = performance.now();
            const growth = result.growth || 0.065;
            window.clearInterval(timer);
            paint(root, ctx);
            timer = window.setInterval(async () => {
                const elapsed = (performance.now() - started) / 1000;
                shown = Math.round(Math.exp(growth * elapsed) * 100) / 100;
                if (crashAt && shown >= crashAt) {
                    window.clearInterval(timer);
                    live = false;
                    shown = crashAt;
                    await ctx.play('crash_bust');
                    paint(root, ctx);
                    return;
                }
                const mult = root.querySelector('#mult');
                const bar = root.querySelector('#bar');
                if (mult) {
                    mult.textContent = `${shown.toFixed(2)}x`;
                    mult.classList.toggle('hot', shown >= 2);
                }
                if (bar) bar.style.width = `${Math.min(100, (shown / 10) * 100)}%`;
            }, result.tickMs || 80);
            return;
        }

        window.clearInterval(timer);
        const result = await ctx.play('crash_cashout');
        live = false;
        if (result.ok) {
            shown = result.cashed || shown;
            crashAt = result.crash || crashAt;
        }
        paint(root, ctx);
    });
}
