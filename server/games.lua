Games = {}

local SUITS = { 's', 'h', 'd', 'c' }
local RANKS = { 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K' }
local RED_ROULETTE = {
    [1] = true, [3] = true, [5] = true, [7] = true, [9] = true, [12] = true,
    [14] = true, [16] = true, [18] = true, [19] = true, [21] = true, [23] = true,
    [25] = true, [27] = true, [30] = true, [32] = true, [34] = true, [36] = true
}

local function shuffle(list)
    for i = #list, 2, -1 do
        local j = math.random(i)
        list[i], list[j] = list[j], list[i]
    end
    return list
end

local function buildShoe(decks)
    local shoe = {}
    for _ = 1, decks do
        for _, suit in ipairs(SUITS) do
            for _, rank in ipairs(RANKS) do
                shoe[#shoe + 1] = { rank = rank, suit = suit }
            end
        end
    end
    return shuffle(shoe)
end

local function draw(shoe)
    return table.remove(shoe)
end

local function rankValue(rank)
    if rank == 'A' then return 11 end
    if rank == 'K' or rank == 'Q' or rank == 'J' then return 10 end
    return tonumber(rank)
end

local function blackjackTotal(cards)
    local total, aces = 0, 0
    for i = 1, #cards do
        local value = rankValue(cards[i].rank)
        total = total + value
        if cards[i].rank == 'A' then
            aces = aces + 1
        end
    end
    while total > 21 and aces > 0 do
        total = total - 10
        aces = aces - 1
    end
    return total, aces > 0
end

local function isBlackjack(cards)
    return #cards == 2 and blackjackTotal(cards) == 21
end

local function pokerValue(rank)
    if rank == 'A' then return 14 end
    if rank == 'K' then return 13 end
    if rank == 'Q' then return 12 end
    if rank == 'J' then return 11 end
    return tonumber(rank)
end

local function weightedPick(entries)
    local total = 0
    for i = 1, #entries do
        total = total + (entries[i].weight or 1)
    end
    local cursor = math.random() * total
    local running = 0
    for i = 1, #entries do
        running = running + (entries[i].weight or 1)
        if cursor <= running then
            return entries[i], i
        end
    end
    return entries[#entries], #entries
end

local function publicCard(card)
    return { rank = card.rank, suit = card.suit }
end

local function publicCards(cards)
    local list = {}
    for i = 1, #cards do
        list[i] = publicCard(cards[i])
    end
    return list
end

function Games.blackjackDeal(bet)
    local shoe = buildShoe(Config.Blackjack.decks)
    local player = { draw(shoe), draw(shoe) }
    local dealer = { draw(shoe), draw(shoe) }
    local playerBj = isBlackjack(player)
    local dealerBj = isBlackjack(dealer)

    local result = {
        kind = 'blackjack',
        bet = bet,
        shoe = shoe,
        player = { player },
        dealer = dealer,
        active = 1,
        doubled = { false },
        done = false
    }

    if playerBj or dealerBj then
        result.done = true
        local payout = 0
        if playerBj and dealerBj then
            payout = bet
        elseif playerBj then
            payout = math.floor(bet + bet * Config.Blackjack.blackjackPayout)
        elseif not dealerBj then
            payout = 0
        end
        result.payout = payout
    end

    return result
end

local function playDealer(session)
    local dealer = session.dealer
    while true do
        local total, soft = blackjackTotal(dealer)
        if total < 17 or (total == 17 and soft and Config.Blackjack.dealerHitsSoft17) then
            dealer[#dealer + 1] = draw(session.shoe)
        else
            break
        end
    end
end

function Games.blackjackAct(session, action)
    if session.done then
        return session, 'Round already settled'
    end

    if action ~= 'hit' and action ~= 'stand' and action ~= 'double' and action ~= 'split' then
        return session, 'Invalid action'
    end

    local hand = session.player[session.active]
    local total = blackjackTotal(hand)

    if action == 'hit' then
        if total >= 21 then
            return session, 'Hand is already finished'
        end
        hand[#hand + 1] = draw(session.shoe)
        if blackjackTotal(hand) >= 21 then
            action = 'stand'
        end
    end

    if action == 'double' then
        if not Config.Blackjack.allowDouble or #hand ~= 2 then
            return session, 'Double is not available'
        end
        session.doubled[session.active] = true
        hand[#hand + 1] = draw(session.shoe)
        action = 'stand'
    end

    if action == 'split' then
        if not Config.Blackjack.allowSplit or #session.player >= Config.Blackjack.maxSplitHands then
            return session, 'Split is not available'
        end
        if #hand ~= 2 or rankValue(hand[1].rank) ~= rankValue(hand[2].rank) then
            return session, 'Cards cannot be split'
        end
        local second = { hand[2] }
        hand[2] = draw(session.shoe)
        second[2] = draw(session.shoe)
        session.player[#session.player + 1] = second
        session.doubled[#session.doubled + 1] = false
        return session
    end

    if action == 'stand' then
        if session.active < #session.player then
            session.active = session.active + 1
            return session
        end

        playDealer(session)
        session.done = true
        local dealerTotal = blackjackTotal(session.dealer)
        local payout = 0
        for i = 1, #session.player do
            local wager = session.doubled[i] and session.bet * 2 or session.bet
            local playerTotal = blackjackTotal(session.player[i])
            if playerTotal <= 21 then
                if dealerTotal > 21 or playerTotal > dealerTotal then
                    payout = payout + wager * 2
                elseif playerTotal == dealerTotal then
                    payout = payout + wager
                end
            end
        end
        session.payout = payout
    end

    return session
end

function Games.blackjackPublic(session)
    local dealer = publicCards(session.dealer)
    if not session.done then
        dealer[2] = { hidden = true }
    end

    local hands = {}
    for i = 1, #session.player do
        hands[i] = {
            cards = publicCards(session.player[i]),
            total = blackjackTotal(session.player[i]),
            doubled = session.doubled[i] and true or false
        }
    end

    return {
        hands = hands,
        dealer = dealer,
        dealerTotal = session.done and blackjackTotal(session.dealer) or nil,
        active = session.active,
        done = session.done,
        payout = session.payout,
        canDouble = Config.Blackjack.allowDouble and not session.done and #session.player[session.active] == 2,
        canSplit = Config.Blackjack.allowSplit
            and not session.done
            and #session.player < Config.Blackjack.maxSplitHands
            and #session.player[session.active] == 2
            and rankValue(session.player[session.active][1].rank) == rankValue(session.player[session.active][2].rank)
    }
end

function Games.rouletteSpin(bet, placement)
    local pockets = { '0' }
    for i = 1, 36 do
        pockets[#pockets + 1] = tostring(i)
    end
    if Config.Roulette.type == 'american' then
        pockets[#pockets + 1] = '00'
    end

    local pocket = pockets[math.random(#pockets)]
    local number = tonumber(pocket)
    local won = false
    local payoutOdd = 0
    local kind = placement and placement.kind
    local value = placement and placement.value

    if kind == 'straight' then
        local pocketValue = tostring(value)
        if pocketValue ~= '0' and pocketValue ~= '00' then
            local n = tonumber(value)
            if not n or n < 1 or n > 36 or n % 1 ~= 0 then
                return nil, 'Invalid straight bet'
            end
        end
        if Config.Roulette.type ~= 'american' and pocketValue == '00' then
            return nil, 'Invalid straight bet'
        end
        won = pocketValue == pocket
        payoutOdd = Config.Roulette.payouts.straight
    elseif kind == 'red' or kind == 'black' then
        if number then
            local isRed = RED_ROULETTE[number] == true
            won = (kind == 'red' and isRed) or (kind == 'black' and not isRed)
            payoutOdd = Config.Roulette.payouts.redblack
        end
    elseif kind == 'even' or kind == 'odd' then
        if number then
            won = (kind == 'even' and number % 2 == 0) or (kind == 'odd' and number % 2 == 1)
            payoutOdd = Config.Roulette.payouts.evenodd
        end
    elseif kind == 'low' or kind == 'high' then
        if number then
            won = (kind == 'low' and number >= 1 and number <= 18) or (kind == 'high' and number >= 19)
            payoutOdd = Config.Roulette.payouts.highlow
        end
    elseif kind == 'dozen' then
        local dozen = math.floor(tonumber(value) or 0)
        if dozen < 1 or dozen > 3 then
            return nil, 'Invalid dozen bet'
        end
        if number then
            won = number >= (dozen - 1) * 12 + 1 and number <= dozen * 12
            payoutOdd = Config.Roulette.payouts.dozen
        end
    elseif kind == 'column' then
        local column = math.floor(tonumber(value) or 0)
        if column < 1 or column > 3 then
            return nil, 'Invalid column bet'
        end
        if number then
            won = ((number - 1) % 3) + 1 == column
            payoutOdd = Config.Roulette.payouts.column
        end
    else
        return nil, 'Unknown roulette bet'
    end

    return {
        pocket = pocket,
        color = number and (RED_ROULETTE[number] and 'red' or 'black') or 'green',
        won = won,
        payout = won and math.floor(bet + bet * payoutOdd) or 0
    }
end

function Games.slotsSpin(bet)
    local symbols = Config.Slots.symbols
    local grid = {}
    for row = 1, 3 do
        grid[row] = {}
        for reel = 1, 5 do
            grid[row][reel] = weightedPick(symbols).id
        end
    end

    local paylines = {
        { 2, 2, 2, 2, 2 },
        { 1, 1, 1, 1, 1 },
        { 3, 3, 3, 3, 3 }
    }
    local lineCount = math.min(Config.Slots.paylines or 3, #paylines)

    local payout = 0
    local hits = {}
    for lineIndex = 1, lineCount do
        local line = paylines[lineIndex]
        local first = grid[line[1]][1]
        local match = 1
        for reel = 2, 5 do
            if grid[line[reel]][reel] == first then
                match = match + 1
            else
                break
            end
        end
        if match >= 3 then
            local symbol
            for i = 1, #symbols do
                if symbols[i].id == first then
                    symbol = symbols[i]
                    break
                end
            end
            local odd = symbol and symbol.payouts[match]
            if odd then
                local win = math.floor(bet * odd)
                payout = payout + win
                hits[#hits + 1] = { line = lineIndex, symbol = first, match = match, win = win }
            end
        end
    end

    return { grid = grid, hits = hits, payout = payout }
end

local function pokerCounts(cards)
    local ranks, suits = {}, {}
    local values = {}
    for i = 1, #cards do
        local value = pokerValue(cards[i].rank)
        values[i] = value
        ranks[value] = (ranks[value] or 0) + 1
        suits[cards[i].suit] = (suits[cards[i].suit] or 0) + 1
    end
    table.sort(values)
    return ranks, suits, values
end

local function isStraight(values)
    local unique = {}
    for i = 1, #values do
        unique[values[i]] = true
    end
    local list = {}
    for value in pairs(unique) do
        list[#list + 1] = value
    end
    table.sort(list)
    if #list ~= 5 then
        return false
    end
    if list[1] == 2 and list[2] == 3 and list[3] == 4 and list[4] == 5 and list[5] == 14 then
        return true
    end
    return list[5] - list[1] == 4
end

function Games.pokerRank(cards)
    local ranks, suits, values = pokerCounts(cards)
    local flush = false
    for _, count in pairs(suits) do
        if count == 5 then
            flush = true
        end
    end
    local straight = isStraight(values)
    local counts, highPair = {}, 0
    for value, count in pairs(ranks) do
        counts[#counts + 1] = count
        if count == 2 and value > highPair then
            highPair = value
        end
    end
    table.sort(counts)

    local pay = Config.Poker.paytable
    if straight and flush and values[1] == 10 then
        return 'royal', pay.royal
    end
    if straight and flush then
        return 'straightFlush', pay.straightFlush
    end
    if counts[#counts] == 4 then
        return 'fours', pay.fours
    end
    if counts[1] == 2 and counts[2] == 3 then
        return 'fullHouse', pay.fullHouse
    end
    if flush then
        return 'flush', pay.flush
    end
    if straight then
        return 'straight', pay.straight
    end
    if counts[#counts] == 3 then
        return 'trips', pay.trips
    end
    if counts[1] == 2 and counts[2] == 2 then
        return 'twoPair', pay.twoPair
    end
    if counts[#counts] == 2 and highPair >= 11 then
        return 'jacksOrBetter', pay.jacksOrBetter
    end
    return 'none', 0
end

function Games.pokerDeal(bet)
    local shoe = buildShoe(1)
    local cards = {}
    for i = 1, 5 do
        cards[i] = draw(shoe)
    end
    return { kind = 'poker', bet = bet, shoe = shoe, cards = cards, held = { false, false, false, false, false } }
end

function Games.pokerDraw(session, held)
    for i = 1, 5 do
        session.held[i] = held[i] == true
        if not session.held[i] then
            session.cards[i] = draw(session.shoe)
        end
    end
    local rank, odd = Games.pokerRank(session.cards)
    session.done = true
    session.rank = rank
    session.payout = odd > 0 and math.floor(session.bet * odd) or 0
    return session
end

function Games.crashPoint()
    if math.random() < Config.Crash.instantCrashChance then
        return 1.00
    end
    local roll = math.random()
    local point = (1.0 - Config.Crash.houseEdge) / math.max(0.0001, 1.0 - roll)
    point = math.min(Config.Crash.maxMultiplier, point)
    return math.floor(point * 100 + 0.5) / 100
end

function Games.diceRoll(bet, target, chance)
    local payoutOdd
    chance, payoutOdd = Odds.dicePayout(chance)
    local roll = math.random(1, 100)
    local won
    if target == 'over' then
        won = roll > (100 - chance)
    else
        won = roll <= chance
    end
    return {
        roll = roll,
        chance = chance,
        target = target == 'over' and 'over' or 'under',
        won = won,
        payout = won and math.floor(bet * payoutOdd) or 0
    }
end

local function baccaratTotal(cards)
    local total = 0
    for i = 1, #cards do
        local value = rankValue(cards[i].rank)
        if value == 11 then
            value = 1
        elseif value == 10 then
            value = 0
        end
        total = total + value
    end
    return total % 10
end

function Games.baccaratDeal(bet, side)
    if side ~= 'player' and side ~= 'banker' and side ~= 'tie' then
        return nil, 'Choose player, banker, or tie'
    end

    local shoe = buildShoe(8)
    local player = { draw(shoe), draw(shoe) }
    local banker = { draw(shoe), draw(shoe) }
    local playerTotal = baccaratTotal(player)
    local bankerTotal = baccaratTotal(banker)
    local playerThird, bankerThird = false, false

    if playerTotal < 8 and bankerTotal < 8 then
        if playerTotal <= 5 then
            player[#player + 1] = draw(shoe)
            playerThird = true
            playerTotal = baccaratTotal(player)
        end

        local third = playerThird and rankValue(player[3].rank) or nil
        if third == 11 then third = 1 elseif third == 10 then third = 0 end

        if not playerThird then
            if bankerTotal <= 5 then
                banker[#banker + 1] = draw(shoe)
                bankerThird = true
            end
        else
            local drawBanker = false
            if bankerTotal <= 2 then
                drawBanker = true
            elseif bankerTotal == 3 then
                drawBanker = third ~= 8
            elseif bankerTotal == 4 then
                drawBanker = third >= 2 and third <= 7
            elseif bankerTotal == 5 then
                drawBanker = third >= 4 and third <= 7
            elseif bankerTotal == 6 then
                drawBanker = third == 6 or third == 7
            end
            if drawBanker then
                banker[#banker + 1] = draw(shoe)
                bankerThird = true
            end
        end
        playerTotal = baccaratTotal(player)
        bankerTotal = baccaratTotal(banker)
    end

    local winner = 'tie'
    if playerTotal > bankerTotal then
        winner = 'player'
    elseif bankerTotal > playerTotal then
        winner = 'banker'
    end

    local payout = 0
    if side == winner then
        if winner == 'player' then
            payout = math.floor(bet + bet * Config.Baccarat.playerPayout)
        elseif winner == 'banker' then
            payout = math.floor(bet + bet * Config.Baccarat.bankerPayout)
        else
            payout = math.floor(bet + bet * Config.Baccarat.tiePayout)
        end
    elseif winner == 'tie' and side ~= 'tie' then
        payout = bet
    end

    return {
        player = publicCards(player),
        banker = publicCards(banker),
        playerTotal = playerTotal,
        bankerTotal = bankerTotal,
        winner = winner,
        side = side,
        payout = payout,
        third = { player = playerThird, banker = bankerThird }
    }
end

function Games.wheelSpin(bet)
    local segment, index = weightedPick(Config.Wheel.segments)
    return {
        index = index,
        label = segment.label,
        multiplier = segment.payout,
        payout = math.floor(bet * segment.payout)
    }
end

function Games.minesStart(bet, mines)
    mines = math.floor(tonumber(mines) or Config.Mines.defaultMines)
    mines = math.max(Config.Mines.minMines, math.min(Config.Mines.maxMines, mines))
    local cells = Config.Mines.grid
    local positions = {}
    for i = 1, cells do
        positions[i] = i
    end
    shuffle(positions)

    local bombs = {}
    for i = 1, mines do
        bombs[positions[i]] = true
    end

    return {
        kind = 'mines',
        bet = bet,
        mines = mines,
        bombs = bombs,
        revealed = {},
        done = false,
        payout = 0
    }
end

function Games.minesReveal(session, index)
    index = math.floor(tonumber(index) or 0)
    if session.done then
        return session, 'Round already settled'
    end
    if index < 1 or index > Config.Mines.grid then
        return session, 'Invalid tile'
    end
    if session.revealed[index] then
        return session, 'Tile already revealed'
    end

    if session.bombs[index] then
        session.done = true
        session.hit = index
        session.payout = 0
        session.revealed[index] = 'mine'
        return session
    end

    session.revealed[index] = 'gem'
    local count = 0
    for _ in pairs(session.revealed) do
        count = count + 1
    end
    session.multiplier = Odds.minesMultiplier(session.mines, count)
    session.cashout = math.floor(session.bet * session.multiplier)
    if count >= Config.Mines.grid - session.mines then
        session.done = true
        session.payout = session.cashout
    end
    return session
end

function Games.minesCashout(session)
    if session.done then
        return session, 'Round already settled'
    end
    local count = 0
    for _ in pairs(session.revealed) do
        count = count + 1
    end
    if count <= 0 then
        return session, 'Reveal a tile first'
    end
    session.done = true
    session.payout = session.cashout or 0
    return session
end

function Games.minesPublic(session, revealAll)
    local tiles = {}
    for i = 1, Config.Mines.grid do
        if revealAll and session.done then
            tiles[i] = session.bombs[i] and 'mine' or (session.revealed[i] or 'gem')
        else
            tiles[i] = session.revealed[i] or 'hidden'
        end
    end
    return {
        tiles = tiles,
        mines = session.mines,
        multiplier = session.multiplier or 1,
        cashout = session.cashout or 0,
        done = session.done,
        payout = session.payout,
        hit = session.hit
    }
end

function Games.coinflip(bet, side)
    if side ~= 'heads' and side ~= 'tails' then
        return nil, 'Choose heads or tails'
    end
    local roll = math.random() * 100
    local won = roll < Config.Coinflip.winChance
    local face = won and side or (side == 'heads' and 'tails' or 'heads')
    return {
        face = face,
        won = won,
        payout = won and math.floor(bet * Config.Coinflip.payout) or 0
    }
end
