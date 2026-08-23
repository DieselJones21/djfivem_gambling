Config = {}

-- 'standalone' | 'qb' | 'qbx' | 'esx'
Config.Framework = 'standalone'

-- Command used to open the tablet. Set to false to disable.
Config.OpenCommand = 'gambling'

-- Optional client key mapping name (RegisterKeyMapping). nil disables it.
Config.OpenKey = nil

-- Shown in the tablet footer and used as a close hint.
Config.CloseKeyLabel = 'RSHIFT'

-- ox_inventory / QB / ESX usable item. The tablet opens from this item.
Config.UseItem = true
Config.RequireItem = true
Config.ItemName = 'gambling_tablet'

-- Lifetime house board. Saved to data/leaderboard.json
Config.Leaderboard = {
    size = 10,
    persist = true
}

-- Which player account is used for wagers and payouts.
-- QB/QBX: 'cash' or 'bank'
-- ESX:    'money' or 'bank'
Config.Account = 'cash'

-- Starting chips for standalone / preview mode only.
Config.StartingBalance = 5000

Config.Currency = {
    symbol = '$',
    locale = 'en-US'
}

Config.Bets = {
    min = 10,
    max = 25000,
    presets = { 10, 50, 100, 250, 500, 1000, 2500, 5000 }
}

--[[
    House-facing odds and payouts.
    Every game reads these values at runtime. Change numbers here,
    restart the resource, and both the NUI paytables and server
    settlement use the new values.

    payout = profit multiple on a winning 1-unit stake unless noted.
    A payout of 1 means even money (stake returned + 1x profit).
]]

Config.Blackjack = {
    decks = 6,
    blackjackPayout = 1.5, -- 3:2. Use 1.2 for 6:5
    dealerHitsSoft17 = false,
    allowDouble = true,
    allowSplit = true,
    allowInsurance = false,
    insurancePayout = 2.0,
    maxSplitHands = 2
}

Config.Roulette = {
    -- 'european' = single zero (0). 'american' = 0 and 00
    type = 'european',
    payouts = {
        straight = 35,
        redblack = 1,
        evenodd = 1,
        highlow = 1,
        dozen = 2,
        column = 2
    }
}

Config.Slots = {
    -- Five independent reels, three visible rows, five paylines.
    -- Symbol weights control frequency. payouts[matchCount] is the
    -- profit multiple for that many-of-a-kind on a single payline.
    symbols = {
        { id = 'seven',  label = '7',     weight = 4,  payouts = { [3] = 15, [4] = 50,  [5] = 250 } },
        { id = 'diamond',label = 'DIA',   weight = 8,  payouts = { [3] = 8,  [4] = 25,  [5] = 80 } },
        { id = 'star',   label = 'STAR',  weight = 12, payouts = { [3] = 5,  [4] = 12,  [5] = 40 } },
        { id = 'bell',   label = 'BELL',  weight = 16, payouts = { [3] = 3,  [4] = 8,   [5] = 20 } },
        { id = 'bar',    label = 'BAR',   weight = 20, payouts = { [3] = 2,  [4] = 5,   [5] = 12 } },
        { id = 'cherry', label = 'CHERRY',weight = 26, payouts = { [3] = 1,  [4] = 3,   [5] = 8 } }
    }
}

Config.Poker = {
    -- Jacks or Better video poker. Values are profit multiples for 1 coin.
    -- Royal is conventionally 800 on a 5-coin max bet; we apply the table
    -- to the full wager so a royal pays stake * royal.
    paytable = {
        royal = 800,
        straightFlush = 50,
        fours = 25,
        fullHouse = 9,
        flush = 6,
        straight = 4,
        trips = 3,
        twoPair = 2,
        jacksOrBetter = 1
    }
}

Config.Crash = {
    -- Instant-bust chance plus growth curve. Higher houseEdge lowers the
    -- average cashout multiplier.
    houseEdge = 0.04,
    instantCrashChance = 0.03,
    maxMultiplier = 100,
    tickMs = 80
}

Config.Dice = {
    -- Slider is win chance 2–98. Payout = (100 - houseEdgePercent) / chance.
    houseEdgePercent = 2,
    minChance = 2,
    maxChance = 98
}

Config.Baccarat = {
    playerPayout = 1.0,
    bankerPayout = 0.95, -- 5% commission
    tiePayout = 8.0
}

Config.Wheel = {
    -- Weighted segments. payout is a total-return multiple of the stake
    -- (2 = even money, 0 = lose stake).
    segments = {
        { label = '1x',  payout = 1,  weight = 28, tone = 'mute' },
        { label = '2x',  payout = 2,  weight = 22, tone = 'white' },
        { label = '3x',  payout = 3,  weight = 16, tone = 'red' },
        { label = '5x',  payout = 5,  weight = 12, tone = 'white' },
        { label = '8x',  payout = 8,  weight = 8,  tone = 'red' },
        { label = '15x', payout = 15, weight = 6,  tone = 'white' },
        { label = '25x', payout = 25, weight = 5,  tone = 'red' },
        { label = '50x', payout = 50, weight = 2,  tone = 'white' },
        { label = '0x',  payout = 0,  weight = 1,  tone = 'dead' }
    }
}

Config.Mines = {
    grid = 25,
    minMines = 1,
    maxMines = 20,
    defaultMines = 5,
    houseEdge = 0.03
}

Config.Coinflip = {
    -- Fair coin is 50. Lower this to add house edge while keeping 2x payout.
    winChance = 48,
    payout = 2
}

-- Optional Discord-style webhook. Leave empty to disable.
Config.LogWebhook = ''
