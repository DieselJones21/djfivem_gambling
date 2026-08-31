local sessions = {}
local stats = {}
local opened = {}
local lastPlay = {}
local RATE_FREE = {
    blackjack_act = true,
    crash_cashout = true,
    crash_bust = true,
    mines_reveal = true,
    mines_cashout = true,
    poker_draw = true
}

local ALLOWED = {
    blackjack_deal = true,
    blackjack_act = true,
    roulette = true,
    slots = true,
    poker_deal = true,
    poker_draw = true,
    crash_start = true,
    crash_cashout = true,
    crash_bust = true,
    dice = true,
    baccarat = true,
    wheel = true,
    mines_start = true,
    mines_reveal = true,
    mines_cashout = true,
    coinflip = true
}

local function emptyStats()
    return {
        wagered = 0,
        won = 0,
        lost = 0,
        lastWin = 0,
        history = {}
    }
end

local function playerStats(source)
    stats[source] = stats[source] or emptyStats()
    return stats[source]
end

local function snapshotHistory(record)
    local copy = {}
    for i = 1, #record do
        copy[i] = record[i]
    end
    return copy
end

local function pushHistory(source, game, bet, payout)
    local data = playerStats(source)
    data.wagered = data.wagered + bet
    data.won = data.won + payout
    data.lastWin = payout > bet and (payout - bet) or 0
    if payout == 0 then
        data.lost = data.lost + bet
    end

    local profit = payout - bet
    table.insert(data.history, 1, {
        game = game,
        bet = bet,
        payout = payout,
        profit = profit,
        at = os.time()
    })
    while #data.history > 14 do
        data.history[#data.history] = nil
    end
end

local function payload(source, extra)
    local data = playerStats(source)
    local body = {
        ok = true,
        balance = Framework.getBalance(source),
        stats = {
            wagered = data.wagered,
            won = data.won,
            lost = data.lost,
            lastWin = data.lastWin,
            history = snapshotHistory(data.history)
        }
    }
    if extra then
        for key, value in pairs(extra) do
            body[key] = value
        end
    end
    return body
end

local function fail(message)
    return { ok = false, error = message }
end

local function takeBet(source, amount)
    local bet, err = Odds.clampBet(amount)
    if not bet then
        return nil, err
    end
    if not Framework.removeMoney(source, bet) then
        return nil, 'Not enough chips'
    end
    return bet
end

local function settle(source, game, bet, payout, extra)
    payout = Odds.capPayout(payout)
    bet = math.floor(tonumber(bet) or 0)
    if payout > 0 then
        Framework.addMoney(source, payout)
    end
    pushHistory(source, game, bet, payout)
    extra = extra or {}
    extra.game = game
    extra.bet = bet
    extra.payout = payout
    extra.profit = payout - bet
    extra.leaderboard = Leaderboard.record(source, payout - bet)
    return payload(source, extra)
end

local function clearSession(source)
    sessions[source] = nil
end

CreateThread(function()
    math.randomseed(GetGameTimer() + os.time())
    Framework.setup()
end)

local CRASH_GROWTH = 0.065

local function crashMultiplier(elapsed)
    return math.floor(math.exp(CRASH_GROWTH * math.max(0, elapsed)) * 100 + 0.5) / 100
end

local function crashDuration(point)
    return math.log(math.max(1.01, point)) / CRASH_GROWTH
end

local function forfeit(source)
    local session = sessions[source]
    if not session or not session.bet then
        sessions[source] = nil
        return
    end
    local kind = session.kind or 'table'
    local bet = session.bet
    sessions[source] = nil
    settle(source, kind, bet, 0, { forfeited = true })
end

local function canPlay(source, action)
    if not opened[source] then
        return nil, 'Tablet is closed'
    end
    if Config.UseItem and Config.RequireItem and not Framework.hasItem(source, Config.ItemName) then
        return nil, 'You need an Envy tablet.'
    end
    if not RATE_FREE[action] then
        local now = GetGameTimer()
        local wait = tonumber(Config.PlayRateMs) or 150
        if lastPlay[source] and now - lastPlay[source] < wait then
            return nil, 'Slow down'
        end
        lastPlay[source] = now
    end
    return true
end

CreateThread(function()
    if not Config.UseItem then
        return
    end

    if (Framework.name == 'qb' or Framework.name == 'qbx') and Framework.core and Framework.core.Functions.CreateUseableItem then
        Framework.core.Functions.CreateUseableItem(Config.ItemName, function(source)
            TriggerClientEvent('djfivem_gambling:client:useItem', source)
        end)
    end
end)

local function openFor(source)
    if Config.UseItem and Config.RequireItem and not Framework.hasItem(source, Config.ItemName) then
        TriggerClientEvent('djfivem_gambling:client:notify', source, 'You need an Envy tablet.')
        return
    end

    opened[source] = true
    lastPlay[source] = 0

    TriggerClientEvent('djfivem_gambling:client:open', source, {
        player = {
            name = Framework.playerName(source),
            role = 'Player'
        },
        config = Odds.publicConfig(),
        balance = Framework.getBalance(source),
        stats = playerStats(source),
        leaderboard = Leaderboard.snapshot(source)
    })
end

RegisterNetEvent('djfivem_gambling:server:open', function()
    openFor(source)
end)

RegisterNetEvent('djfivem_gambling:server:close', function()
    local source = source
    opened[source] = nil
    forfeit(source)
end)

local actions = {}

function actions.blackjack_deal(source, data)
    if sessions[source] then
        return fail('Finish the current round first')
    end
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local session = Games.blackjackDeal(bet)
    if session.done then
        return settle(source, 'blackjack', bet, session.payout or 0, {
            table = Games.blackjackPublic(session)
        })
    end
    sessions[source] = session
    return payload(source, { table = Games.blackjackPublic(session), reserved = bet })
end

function actions.blackjack_act(source, data)
    local session = sessions[source]
    if not session or session.kind ~= 'blackjack' then
        return fail('No blackjack round is open')
    end
    if not session.player[session.active] then
        return fail('Invalid hand')
    end

    local extraBet = 0
    if data.action ~= 'hit' and data.action ~= 'stand' and data.action ~= 'double' and data.action ~= 'split' then
        return fail('Invalid action')
    end
    if data.action == 'double' then
        if not Config.Blackjack.allowDouble or #session.player[session.active] ~= 2 then
            return fail('Double is not available')
        end
        extraBet = session.bet
        if not Framework.removeMoney(source, extraBet) then
            return fail('Not enough chips for that action')
        end
    elseif data.action == 'split' then
        if not Config.Blackjack.allowSplit
            or #session.player >= Config.Blackjack.maxSplitHands
            or #session.player[session.active] ~= 2 then
            return fail('Split is not available')
        end
        extraBet = session.bet
        if not Framework.removeMoney(source, extraBet) then
            return fail('Not enough chips for that action')
        end
    end

    local updated, err = Games.blackjackAct(session, data.action)
    if err then
        if extraBet > 0 then
            Framework.addMoney(source, extraBet)
        end
        return fail(err)
    end

    if updated.done then
        sessions[source] = nil
        local totalBet = session.bet
        for i = 1, #session.doubled do
            if i > 1 then
                totalBet = totalBet + session.bet
            end
            if session.doubled[i] then
                totalBet = totalBet + session.bet
            end
        end
        return settle(source, 'blackjack', totalBet, updated.payout or 0, {
            table = Games.blackjackPublic(updated)
        })
    end

    return payload(source, { table = Games.blackjackPublic(updated) })
end

function actions.roulette(source, data)
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local result, spinErr = Games.rouletteSpin(bet, data.placement or {})
    if not result then
        Framework.addMoney(source, bet)
        return fail(spinErr)
    end
    return settle(source, 'roulette', bet, result.payout, { result = result })
end

function actions.slots(source, data)
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local result = Games.slotsSpin(bet)
    return settle(source, 'slots', bet, result.payout, { result = result })
end

function actions.poker_deal(source, data)
    if sessions[source] then
        return fail('Finish the current round first')
    end
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local session = Games.pokerDeal(bet)
    sessions[source] = session
    return payload(source, { cards = session.cards, held = session.held })
end

function actions.poker_draw(source, data)
    local session = sessions[source]
    if not session or session.kind ~= 'poker' then
        return fail('No poker round is open')
    end
    local held = {}
    for i = 1, 5 do
        held[i] = data.held and data.held[i] == true
    end
    Games.pokerDraw(session, held)
    sessions[source] = nil
    return settle(source, 'poker', session.bet, session.payout, {
        cards = session.cards,
        held = session.held,
        rank = session.rank
    })
end

function actions.crash_start(source, data)
    if sessions[source] then
        return fail('Finish the current round first')
    end
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local crash = Games.crashPoint()
    local session = {
        kind = 'crash',
        bet = bet,
        crash = crash,
        started = GetGameTimer(),
        src = source
    }
    sessions[source] = session

    CreateThread(function()
        Wait(math.floor(crashDuration(crash) * 1000))
        local active = sessions[source]
        if active ~= session then
            return
        end
        sessions[source] = nil
        local result = settle(source, 'crash', session.bet, 0, {
            crash = session.crash,
            busted = true
        })
        TriggerClientEvent('djfivem_gambling:client:result', source, result)
    end)

    return payload(source, {
        started = true,
        growth = CRASH_GROWTH,
        tickMs = Config.Crash.tickMs,
        maxMultiplier = Config.Crash.maxMultiplier
    })
end

function actions.crash_cashout(source)
    local session = sessions[source]
    if not session or session.kind ~= 'crash' then
        return fail('No crash round is open')
    end

    local elapsed = (GetGameTimer() - session.started) / 1000.0
    local current = crashMultiplier(elapsed)
    if current >= session.crash then
        sessions[source] = nil
        return settle(source, 'crash', session.bet, 0, { crash = session.crash, busted = true })
    end

    local payout = math.floor(session.bet * math.min(current, session.crash - 0.01))
    sessions[source] = nil
    return settle(source, 'crash', session.bet, payout, {
        crash = session.crash,
        cashed = current
    })
end

function actions.crash_bust(source)
    local session = sessions[source]
    if not session or session.kind ~= 'crash' then
        return fail('No crash round is open')
    end
    local elapsed = (GetGameTimer() - session.started) / 1000.0
    if crashMultiplier(elapsed) < session.crash then
        return fail('Round still live')
    end
    sessions[source] = nil
    return settle(source, 'crash', session.bet, 0, { crash = session.crash, busted = true })
end

function actions.dice(source, data)
    if data.target ~= 'over' and data.target ~= 'under' then
        return fail('Choose over or under')
    end
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local result = Games.diceRoll(bet, data.target, data.chance)
    return settle(source, 'dice', bet, result.payout, { result = result })
end

function actions.baccarat(source, data)
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local result, dealErr = Games.baccaratDeal(bet, data.side)
    if not result then
        Framework.addMoney(source, bet)
        return fail(dealErr)
    end
    return settle(source, 'baccarat', bet, result.payout, { result = result })
end

function actions.wheel(source, data)
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local result = Games.wheelSpin(bet)
    return settle(source, 'wheel', bet, result.payout, { result = result })
end

function actions.mines_start(source, data)
    if sessions[source] then
        return fail('Finish the current round first')
    end
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local session = Games.minesStart(bet, data.mines)
    sessions[source] = session
    return payload(source, { board = Games.minesPublic(session), reserved = bet })
end

function actions.mines_reveal(source, data)
    local session = sessions[source]
    if not session or session.kind ~= 'mines' then
        return fail('No mines round is open')
    end
    local updated, err = Games.minesReveal(session, data.index)
    if err then
        return fail(err)
    end
    if updated.done then
        sessions[source] = nil
        return settle(source, 'mines', session.bet, updated.payout or 0, {
            board = Games.minesPublic(updated, true)
        })
    end
    return payload(source, { board = Games.minesPublic(updated) })
end

function actions.mines_cashout(source)
    local session = sessions[source]
    if not session or session.kind ~= 'mines' then
        return fail('No mines round is open')
    end
    local updated, err = Games.minesCashout(session)
    if err then
        return fail(err)
    end
    sessions[source] = nil
    return settle(source, 'mines', session.bet, updated.payout or 0, {
        board = Games.minesPublic(updated, true)
    })
end

function actions.coinflip(source, data)
    local bet, err = takeBet(source, data.bet)
    if not bet then
        return fail(err)
    end
    local result, flipErr = Games.coinflip(bet, data.side)
    if not result then
        Framework.addMoney(source, bet)
        return fail(flipErr)
    end
    return settle(source, 'coinflip', bet, result.payout, { result = result })
end

RegisterNetEvent('djfivem_gambling:server:play', function(action, data, requestId)
    local source = source
    if type(data) ~= 'table' then
        data = {}
    end
    if type(action) ~= 'string' or not ALLOWED[action] then
        TriggerClientEvent('djfivem_gambling:client:result', source, fail('Unknown action'), requestId)
        return
    end
    local allowed, err = canPlay(source, action)
    if not allowed then
        TriggerClientEvent('djfivem_gambling:client:result', source, fail(err), requestId)
        return
    end
    local handler = actions[action]
    if not handler then
        TriggerClientEvent('djfivem_gambling:client:result', source, fail('Unknown action'), requestId)
        return
    end

    local ok, result = pcall(handler, source, data)
    if not ok then
        TriggerClientEvent('djfivem_gambling:client:result', source, fail('Round failed'), requestId)
        return
    end
    TriggerClientEvent('djfivem_gambling:client:result', source, result, requestId)
end)

AddEventHandler('playerDropped', function()
    local source = source
    opened[source] = nil
    lastPlay[source] = nil
    forfeit(source)
    stats[source] = nil
end)

exports('openTablet', function(source)
    openFor(source)
end)

exports('useTablet', function(event, item, inventory)
    local src = inventory and (inventory.id or inventory.owner) or source
    if src then
        openFor(src)
    end
end)
