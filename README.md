# djfivem_gambling

A FiveM gambling tablet with a black / red / white dashboard UI. Every popular table is included, and every payout lives in `config.lua` so you can tune the house without touching game code.

## Tables

- Blackjack (hit, stand, double, split, configurable 3:2 or 6:5)
- European or American roulette
- Five-reel, five-line slots
- Jacks or Better video poker
- Crash
- Dice (over / under with live odds)
- Baccarat (player, banker, tie)
- Fortune wheel
- Mines
- Coin flip

The **Board** tab ranks lifetime money won and money lost. The **Odds** tab shows the live public paytables.

## Install

1. Drop the resource into `resources/[standalone]/djfivem_gambling`
2. Add `ensure djfivem_gambling` after `ox_inventory` in `server.cfg`
3. Set `Config.Framework` in `config.lua` to `standalone`, `qb`, `qbx`, or `esx`
4. Add the `gambling_tablet` item to ox_inventory (below)
5. Restart and use the item — or `/gambling` if you already have one

Standalone mode keeps a per-license chip balance starting at `Config.StartingBalance`. QB / QBX / ESX debit and credit `Config.Account`.

## Open it with ox_inventory

`Config.UseItem` and `Config.RequireItem` default to `true`. Using `gambling_tablet` opens the UI. `/gambling` also works, but only if that player actually has the item.

Paste this into `ox_inventory/data/items.lua`:

```lua
['gambling_tablet'] = {
    label = 'House Tablet',
    weight = 380,
    stack = false,
    close = true,
    consume = 0,
    description = 'A black casino tablet. Use it to open the house games.',
    client = {
        export = 'djfivem_gambling.useTablet',
        image = 'gambling_tablet.png',
        usetime = 250
    }
},
```

Copy `install/ox_inventory/gambling_tablet.png` into `ox_inventory/web/images/`.

Give one with:

```
/giveitem [id] gambling_tablet 1
```

or the ox_inventory admin give command.

| Method | How |
| --- | --- |
| Item | Use `gambling_tablet` |
| Command | `/gambling` if `Config.RequireItem` is satisfied |
| Export | `exports.djfivem_gambling:useTablet()` client, or `exports.djfivem_gambling:openTablet(source)` server |

Right Shift (or Escape) closes the tablet.

Set `Config.RequireItem = false` if you want the command to work without the item.

## Leaderboard

The **Board** tab shows two lists:

- **Most money won** — lifetime profit (payout minus stake on winning hands)
- **Most money lost** — lifetime losses (stake minus payout on losing hands)

Ranks persist in `data/leaderboard.json` and survive resource restarts. Tune `Config.Leaderboard.size` for how many names to show.

## Configure odds and payouts

Edit `config.lua` and restart the resource. The NUI does not invent numbers — it renders whatever `Odds.publicConfig()` sends.

| Block | What it changes |
| --- | --- |
| `Config.Bets` | Table min / max and chip presets |
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

Open `http://127.0.0.1:4173`. Outside FiveM it runs a local engine with the same paytables so you can click through every table.

## Layout

```
config.lua            house numbers
shared/odds.lua       public config + shared math
client/main.lua       NUI focus, item export
server/framework.lua  QB / QBX / ESX / standalone money
server/leaderboard.lua  persistent won / lost ranks
server/games.lua      table logic
server/main.lua       sessions and settlement
install/ox_inventory  item snippet + icon
html/                 tablet UI
```
