# djfivem_gambling

A FiveM gambling tablet themed to **City of Dreams** — a mainly black glass shell with white chrome and the house logo as the only real color. Players convert **memecoin** crypto into chips, then wager those chips on every table. All payouts live in `config.lua`.

## Tables

- Blackjack (hit, stand, double, split, even-money blackjack)
- European or American roulette
- Five-reel, three-line slots
- Jacks or Better video poker
- Crash
- Dice (over / under with live odds)
- Baccarat (player, banker, tie)
- Fortune wheel
- Mines
- Coin flip

The **Dashboard** cashier converts memecoin into house chips (and back). The **Board** tab ranks lifetime chips won and lost. The **Odds** tab shows the live public paytables.

## Install

1. Drop the resource into `resources/[standalone]/djfivem_gambling`
2. Add `ensure djfivem_gambling` after `ox_inventory` in `server.cfg`
3. Set `Config.Framework` in `config.lua` to `standalone`, `qb`, `qbx`, or `esx`
4. Add the `gambling_tablet` and `memecoin` items to ox_inventory (below)
5. Restart and use the tablet — or `/gambling` if you already have one

Wagers settle in **chips**, not cash. Players buy chips from the cashier with the `memecoin` item (or a money account if you set `Config.Memecoin.account`). Chip balances persist in `data/chips.json`. Standalone mode seeds `Config.StartingMemecoin` the first time a player opens the tablet.

## Open it with ox_inventory

`Config.UseItem` and `Config.RequireItem` default to `true`. Using `gambling_tablet` opens the UI. `/gambling` also works, but only if that player actually has the item.

Paste this into `ox_inventory/data/items.lua`:

```lua
['gambling_tablet'] = {
    label = 'Dreams Tablet',
    weight = 380,
    stack = false,
    close = true,
    consume = 0,
    description = 'City of Dreams house tablet. Convert memecoin into chips and play the tables.',
    client = {
        export = 'djfivem_gambling.useTablet',
        image = 'gambling_tablet.png',
        usetime = 250
    }
},

['memecoin'] = {
    label = 'Memecoin',
    weight = 0,
    stack = true,
    close = false,
    description = 'City of Dreams crypto. Convert it on the gambling tablet into chips.',
},
```

Copy `html/img/logo-mark.png` into `ox_inventory/web/images/gambling_tablet.png` (and optionally `memecoin.png`).

Give one with:

```
/giveitem [id] gambling_tablet 1
/giveitem [id] memecoin 1000
```

| Method | How |
| --- | --- |
| Item | Use `gambling_tablet` |
| Command | `/gambling` if `Config.RequireItem` is satisfied |
| Export | `exports.djfivem_gambling:useTablet()` client, or `exports.djfivem_gambling:openTablet(source)` server |

Right Shift (or Escape) closes the tablet.

Set `Config.RequireItem = false` if you want the command to work without the item.

## Memecoin cashier

The dashboard cashier is the only way onto the felt.

| Setting | What it does |
| --- | --- |
| `Config.Memecoin.enabled` | Chip wallet + cashier. Set `false` to fall back to cash/`Config.Account` |
| `Config.Memecoin.item` | Inventory item taken and returned (`memecoin`) |
| `Config.Memecoin.account` | Optional money account instead of an item (e.g. `'crypto'`) |
| `Config.Memecoin.rate` | Chips granted per 1 memecoin |
| `Config.Memecoin.allowCashout` | Let players convert chips back to memecoin |

Buy chips: cashier takes memecoin and credits `amount * rate` chips. Cash out: cashier takes chips in multiples of `rate` and returns memecoin.

## Leaderboard

The **Board** tab shows two lists:

- **Most money won** — lifetime profit (payout minus stake on winning hands)
- **Most money lost** — lifetime losses (stake minus payout on losing hands)

Ranks persist in `data/leaderboard.json` and survive resource restarts. Tune `Config.Leaderboard.size` for how many names to show.

## Configure odds and payouts

Edit `config.lua` and restart the resource. The NUI does not invent numbers — it renders whatever `Odds.publicConfig()` sends.

House numbers in this build are tighter than the previous tablet (people were winning too much) and **every bet preset is half** of the old ladder.

| Block | What it changes |
| --- | --- |
| `Config.Bets` | Table min / max and chip presets (now 5 → 50,000) |
| `Config.Blackjack` | Blackjack payout, soft 17, double / split |
| `Config.Roulette` | European vs American, plus every even-money and inside payout |
| `Config.Slots.symbols` | Symbol weights and 3 / 4 / 5-kind payouts |
| `Config.Poker.paytable` | Jacks or Better multiples |
| `Config.Crash` | House edge, instant-bust chance, cap |
| `Config.Dice` | House-edge percent used as `(100 - edge) / chance` |
| `Config.Baccarat` | Player / banker / tie multiples |
| `Config.Wheel.segments` | Labels, payouts, and weights |
| `Config.Mines` | Grid size, mine range, house edge |
| `Config.Coinflip` | Win chance and payout multiple |

Money never settles in the browser when running inside FiveM. The client only animates. The server rolls the outcome, removes the wager, and pays the configured multiple.

Play is rejected unless the tablet is open, the player still has the item, and requests are rate-limited. Crash points are never sent to the NUI. A single round cannot pay more than `Config.MaxPayout`.

## Preview the UI

The NUI is static files. From `html/`:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`. Outside FiveM it runs a local engine with the same paytables so you can click through every table, including the memecoin cashier.

## Layout

```
config.lua            house numbers + memecoin cashier
shared/odds.lua       public config + shared math
client/main.lua       NUI focus, item export, convert callback
server/framework.lua  QB / QBX / ESX / standalone money + items
server/chips.lua      persistent chip wallet + memecoin conversion
server/leaderboard.lua  persistent won / lost ranks
server/games.lua      table logic
server/main.lua       sessions, settlement, cashier
install/ox_inventory  item snippet
html/                 tablet UI + City of Dreams logo
```
