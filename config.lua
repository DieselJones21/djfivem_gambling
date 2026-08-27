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
    max = 100000,
    presets = { 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000 }
}

-- Hard cap on a single round's returned chips (stake already taken).
Config.MaxPayout = 250000

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
    blackjackPayout = 1.2, -- 6:5, harder than 3:2
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
        straight = 35,
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
        { id = 'seven',  label = '7',     weight = 2,  payouts = { [3] = 8,  [4] = 20, [5] = 80 } },
        { id = 'diamond',label = 'DIA',   weight = 4,  payouts = { [3] = 4,  [4] = 10, [5] = 25 } },
        { id = 'star',   label = 'STAR',  weight = 6,  payouts = { [3] = 3,  [4] = 6,  [5] = 15 } },
        { id = 'bell',   label = 'BELL',  weight = 8,  payouts = { [3] = 2,  [4] = 4,  [5] = 8 } },
        { id = 'bar',    label = 'BAR',   weight = 10, payouts = { [3] = 1,  [4] = 3,  [5] = 5 } },
        { id = 'cherry', label = 'CHERRY',weight = 14, payouts = { [3] = 1,  [4] = 2,  [5] = 3 } },
        { id = 'blank',  label = '',      weight = 46, payouts = {} }
    }
}

Config.Poker = {
    -- 6/5 Jacks or Better, cut jackpot.
    paytable = {
        royal = 250,
        straightFlush = 40,
        fours = 20,
        fullHouse = 6,
        flush = 5,
        straight = 3,
        trips = 2,
        twoPair = 1,
        jacksOrBetter = 1
    }
}

Config.Crash = {
    houseEdge = 0.12,
    instantCrashChance = 0.10,
    maxMultiplier = 20,
    tickMs = 80
}

Config.Dice = {
    houseEdgePercent = 8,
    minChance = 10,
    maxChance = 85
}

Config.Baccarat = {
    playerPayout = 0.85,
    bankerPayout = 0.80,
    tiePayout = 8.0
}

Config.Wheel = {
    -- Weighted for ~0.87 RTP. Most mass is 0x / 1x.
    segments = {
        { label = '0x', payout = 0, weight = 50, tone = 'dead' },
        { label = '1x', payout = 1, weight = 30, tone = 'mute' },
        { label = '2x', payout = 2, weight = 12, tone = 'white' },
        { label = '3x', payout = 3, weight = 5,  tone = 'red' },
        { label = '5x', payout = 5, weight = 2,  tone = 'white' },
        { label = '8x', payout = 8, weight = 1,  tone = 'red' }
    }
}

Config.Mines = {
    grid = 25,
    minMines = 3,
    maxMines = 20,
    defaultMines = 8,
    houseEdge = 0.12
}

Config.Coinflip = {
    winChance = 43,
    payout = 2
}

-- Optional Discord-style webhook. Leave empty to disable.
Config.LogWebhook = ''
