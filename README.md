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

The **Odds** tab shows the live public paytables that the server just sent to the NUI.

## Install

1. Drop the resource into `resources/[standalone]/djfivem_gambling`
2. Add `ensure djfivem_gambling` to `server.cfg`
3. Set `Config.Framework` in `config.lua` to `standalone`, `qb`, `qbx`, or `esx`
4. Restart the server and run `/gambling`

Standalone mode keeps a per-license chip balance starting at `Config.StartingBalance`. QB / QBX / ESX debit and credit `Config.Account`.

## Open it

| Method | How |
| --- | --- |
| Command | `/gambling` (`Config.OpenCommand`) |
| Export | `exports.djfivem_gambling:open()` from client, or `exports.djfivem_gambling:openTablet(source)` from server |
| Item | Set `Config.UseItem = true` and give `gambling_tablet` |

Right Shift (or Escape) closes the tablet. The footer key is only a hint; change the label with `Config.CloseKeyLabel`.

### ox_inventory item

```lua
['gambling_tablet'] = {
    label = 'House Tablet',
    weight = 200,
    stack = false,
    close = true,
    description = 'A dark casino tablet.',
    client = {
        event = 'djfivem_gambling:client:useItem'
    }
}
```

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
client/main.lua       NUI focus and callbacks
server/framework.lua  QB / QBX / ESX / standalone money
server/games.lua      table logic
server/main.lua       sessions and settlement
html/                 tablet UI
```
