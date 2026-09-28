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

-- Which player account is used if Memecoin conversion is disabled.
-- QB/QBX: 'cash' or 'bank'
-- ESX:    'money' or 'bank'
Config.Account = 'cash'

-- Starting chips for standalone / preview when the cashier has not been used yet.
Config.StartingBalance = 0

-- Standalone / preview memecoin granted the first time a player opens the tablet.
Config.StartingMemecoin = 2500

Config.Currency = {
    symbol = '$',
    locale = 'en-US',
    label = 'chips'
}

--[[
    Memecoin is the crypto players convert into house chips.
    Wagers and payouts settle in chips, not cash.

    item    = ox_inventory / QB / ESX item name
    account = optional money account instead of an item (e.g. 'crypto')
    rate    = chips granted per 1 memecoin
]]
Config.Memecoin = {
    enabled = true,
    item = 'memecoin',
    account = nil,
    label = 'Memecoin',
    rate = 1,
    minConvert = 1,
    maxConvert = 50000,
    presets = { 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000 },
    allowCashout = true,
    persist = true
}

Config.Bets = {
    min = 5,
    max = 50000,
    presets = { 5, 25, 50, 125, 250, 500, 1250, 2500, 5000, 12500, 25000, 50000 }
}

-- Hard cap on a single round's returned chips (stake already taken).
Config.MaxPayout = 125000

-- Minimum milliseconds between play requests from one player.
Config.PlayRateMs = 150

--[[
    House-facing odds and payouts.
    Tuned so every table is negative-EV. Change numbers here,
    restart the resource, and both the NUI paytables and server
    settlement use the new values.

    payout = profit multiple on a winning 1-unit stake unless noted.
    A payout of 1 means even money (stake returned + 1x profit).
    Wheel/slots payouts are total-return multiples of the stake.
]]

Config.Blackjack = {
    decks = 6,
    blackjackPayout = 1.0, -- even money, tighter than 6:5
    dealerHitsSoft17 = true,
    allowDouble = true,
    allowSplit = true,
    allowInsurance = false,
    insurancePayout = 2.0,
    maxSplitHands = 2
}

Config.Roulette = {
    -- American double-zero (~5.26% house on even money).
    type = 'american',
    payouts = {
        straight = 30,
        redblack = 1,
        evenodd = 1,
        highlow = 1,
        dozen = 2,
        column = 2
    }
}

Config.Slots = {
    -- Three paylines. Blank symbols eat most spins.
    paylines = 3,
    symbols = {
        { id = 'seven',  label = '7',     weight = 2,  payouts = { [3] = 6,  [4] = 14, [5] = 50 } },
        { id = 'diamond',label = 'DIA',   weight = 3,  payouts = { [3] = 3,  [4] = 8,  [5] = 18 } },
        { id = 'star',   label = 'STAR',  weight = 5,  payouts = { [3] = 2,  [4] = 5,  [5] = 12 } },
        { id = 'bell',   label = 'BELL',  weight = 8,  payouts = { [3] = 2,  [4] = 3,  [5] = 6 } },
        { id = 'bar',    label = 'BAR',   weight = 11, payouts = { [3] = 1,  [4] = 2,  [5] = 4 } },
        { id = 'cherry', label = 'CHERRY',weight = 14, payouts = { [3] = 1,  [4] = 2,  [5] = 3 } },
        { id = 'blank',  label = '',      weight = 52, payouts = {} }
    }
}

Config.Poker = {
    -- 5/4 Jacks or Better, cut jackpot.
    paytable = {
        royal = 200,
        straightFlush = 30,
        fours = 15,
        fullHouse = 5,
        flush = 4,
        straight = 3,
        trips = 2,
        twoPair = 1,
        jacksOrBetter = 1
    }
}

Config.Crash = {
    houseEdge = 0.16,
    instantCrashChance = 0.13,
    maxMultiplier = 12,
    tickMs = 80
}

Config.Dice = {
    houseEdgePercent = 12,
    minChance = 10,
    maxChance = 85
}

Config.Baccarat = {
    playerPayout = 0.80,
    bankerPayout = 0.75,
    tiePayout = 6.0
}

Config.Wheel = {
    -- Weighted for ~0.81 RTP. Most mass is 0x / 1x.
    segments = {
        { label = '0x', payout = 0, weight = 54, tone = 'dead' },
        { label = '1x', payout = 1, weight = 28, tone = 'mute' },
        { label = '2x', payout = 2, weight = 10, tone = 'white' },
        { label = '3x', payout = 3, weight = 5,  tone = 'red' },
        { label = '5x', payout = 5, weight = 2,  tone = 'white' },
        { label = '8x', payout = 8, weight = 1,  tone = 'red' }
    }
}

Config.Mines = {
    grid = 25,
    minMines = 3,
    maxMines = 20,
    defaultMines = 10,
    houseEdge = 0.16
}

Config.Coinflip = {
    winChance = 40,
    payout = 2
}

-- Optional Discord-style webhook. Leave empty to disable.
Config.LogWebhook = ''
