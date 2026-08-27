Odds = {}

local function copy(value)
    if type(value) ~= 'table' then
        return value
    end

    local cloned = {}
    for key, item in pairs(value) do
        cloned[key] = copy(item)
    end
    return cloned
end

function Odds.publicConfig()
    local slotSymbols = {}
    for i, symbol in ipairs(Config.Slots.symbols) do
        slotSymbols[i] = {
            id = symbol.id,
            label = symbol.label,
            payouts = copy(symbol.payouts)
        }
    end

    return {
        currency = copy(Config.Currency),
        bets = copy(Config.Bets),
        closeKey = Config.CloseKeyLabel,
        blackjack = copy(Config.Blackjack),
        roulette = copy(Config.Roulette),
        slots = {
            paylines = Config.Slots.paylines or 3,
            symbols = slotSymbols
        },
        poker = copy(Config.Poker),
        crash = {
            houseEdge = Config.Crash.houseEdge,
            maxMultiplier = Config.Crash.maxMultiplier,
            tickMs = Config.Crash.tickMs
        },
        dice = copy(Config.Dice),
        baccarat = copy(Config.Baccarat),
        wheel = copy(Config.Wheel),
        mines = copy(Config.Mines),
        coinflip = copy(Config.Coinflip)
    }
end

function Odds.clampBet(amount)
    amount = math.floor(tonumber(amount) or 0)
    if amount < Config.Bets.min then
        return nil, 'Bet is below the table minimum'
    end
    if amount > Config.Bets.max then
        return nil, 'Bet is above the table maximum'
    end
    return amount
end

function Odds.capPayout(payout)
    payout = math.floor(tonumber(payout) or 0)
    if payout < 0 then
        return 0
    end
    local cap = tonumber(Config.MaxPayout)
    if cap and payout > cap then
        return cap
    end
    return payout
end

function Odds.dicePayout(chance)
    chance = tonumber(chance) or 50
    chance = math.max(Config.Dice.minChance, math.min(Config.Dice.maxChance, chance))
    local payout = (100.0 - Config.Dice.houseEdgePercent) / chance
    return chance, math.floor(payout * 1000 + 0.5) / 1000
end

function Odds.minesMultiplier(mines, revealed)
    local cells = Config.Mines.grid
    mines = math.max(Config.Mines.minMines, math.min(Config.Mines.maxMines, math.floor(mines or Config.Mines.defaultMines)))
    revealed = math.max(0, math.min(cells - mines, math.floor(revealed or 0)))
    if revealed == 0 then
        return 1.0
    end

    local multiplier = 1.0
    for i = 0, revealed - 1 do
        local safeLeft = cells - mines - i
        local totalLeft = cells - i
        if safeLeft <= 0 or totalLeft <= 0 then
            break
        end
        multiplier = multiplier * (totalLeft / safeLeft)
    end

    multiplier = multiplier * (1.0 - Config.Mines.houseEdge)
    return math.floor(multiplier * 100 + 0.5) / 100
end
