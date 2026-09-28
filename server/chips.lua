Chips = {}

local FILE = 'data/chips.json'
local rows = {}

local function persist()
    if Config.Memecoin and Config.Memecoin.persist == false then
        return
    end
    SaveResourceFile(GetCurrentResourceName(), FILE, json.encode(rows), -1)
end

local function load()
    local raw = LoadResourceFile(GetCurrentResourceName(), FILE)
    if not raw or raw == '' then
        rows = {}
        return
    end
    local ok, decoded = pcall(json.decode, raw)
    rows = (ok and type(decoded) == 'table') and decoded or {}
end

local function playerKey(source)
    return GetPlayerIdentifierByType(source, 'license')
        or GetPlayerIdentifierByType(source, 'license2')
        or ('src:%s'):format(source)
end

local function rowFor(source)
    local key = playerKey(source)
    local row = rows[key]
    if type(row) ~= 'table' then
        row = { chips = tonumber(Config.StartingBalance) or 0, memecoin = 0 }
        rows[key] = row
    end
    row.chips = math.floor(tonumber(row.chips) or 0)
    row.memecoin = math.floor(tonumber(row.memecoin) or 0)
    return row, key
end

function Chips.enabled()
    return not (Config.Memecoin and Config.Memecoin.enabled == false)
end

function Chips.rate()
    local rate = tonumber(Config.Memecoin and Config.Memecoin.rate) or 1
    if rate < 1 then
        return 1
    end
    return math.floor(rate)
end

function Chips.minConvert()
    return math.max(1, math.floor(tonumber(Config.Memecoin and Config.Memecoin.minConvert) or 1))
end

function Chips.maxConvert()
    return math.max(Chips.minConvert(), math.floor(tonumber(Config.Memecoin and Config.Memecoin.maxConvert) or 50000))
end

function Chips.get(source)
    return rowFor(source).chips
end

function Chips.remove(source, amount)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 then
        return false
    end
    local row = rowFor(source)
    if row.chips < amount then
        return false
    end
    row.chips = row.chips - amount
    persist()
    return true
end

function Chips.add(source, amount)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 then
        return
    end
    local row = rowFor(source)
    row.chips = row.chips + amount
    persist()
end

function Chips.useItem()
    local item = Config.Memecoin and Config.Memecoin.item
    return type(item) == 'string' and item ~= ''
end

function Chips.useAccount()
    local account = Config.Memecoin and Config.Memecoin.account
    return type(account) == 'string' and account ~= ''
end

function Chips.getMemecoin(source)
    if Chips.useAccount() then
        return Framework.getAccountMoney(source, Config.Memecoin.account)
    end
    if Chips.useItem() and Framework.hasInventory() then
        return Framework.getItemCount(source, Config.Memecoin.item)
    end
    return rowFor(source).memecoin
end

function Chips.removeMemecoin(source, amount)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 then
        return false
    end
    if Chips.useAccount() then
        return Framework.removeAccountMoney(source, Config.Memecoin.account, amount)
    end
    if Chips.useItem() and Framework.hasInventory() then
        return Framework.removeItem(source, Config.Memecoin.item, amount)
    end
    local row = rowFor(source)
    if row.memecoin < amount then
        return false
    end
    row.memecoin = row.memecoin - amount
    persist()
    return true
end

function Chips.addMemecoin(source, amount)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 then
        return false
    end
    if Chips.useAccount() then
        Framework.addAccountMoney(source, Config.Memecoin.account, amount)
        return true
    end
    if Chips.useItem() and Framework.hasInventory() then
        return Framework.addItem(source, Config.Memecoin.item, amount)
    end
    local row = rowFor(source)
    row.memecoin = row.memecoin + amount
    persist()
    return true
end

function Chips.buy(source, memecoin)
    memecoin = math.floor(tonumber(memecoin) or 0)
    if memecoin < Chips.minConvert() then
        return nil, 'Below the cashier minimum'
    end
    if memecoin > Chips.maxConvert() then
        return nil, 'Above the cashier maximum'
    end
    if Chips.getMemecoin(source) < memecoin then
        return nil, 'Not enough memecoin'
    end
    if not Chips.removeMemecoin(source, memecoin) then
        return nil, 'Could not take memecoin'
    end
    local chips = memecoin * Chips.rate()
    Chips.add(source, chips)
    return {
        memecoin = Chips.getMemecoin(source),
        chips = Chips.get(source),
        converted = memecoin,
        credited = chips
    }
end

function Chips.cashout(source, chips)
    if Config.Memecoin and Config.Memecoin.allowCashout == false then
        return nil, 'Cashier cashout is closed'
    end
    chips = math.floor(tonumber(chips) or 0)
    local rate = Chips.rate()
    if chips < rate or chips % rate ~= 0 then
        return nil, ('Cash out in multiples of %s chips'):format(rate)
    end
    local memecoin = math.floor(chips / rate)
    if memecoin < Chips.minConvert() then
        return nil, 'Below the cashier minimum'
    end
    if memecoin > Chips.maxConvert() then
        return nil, 'Above the cashier maximum'
    end
    if not Chips.remove(source, chips) then
        return nil, 'Not enough chips'
    end
    if not Chips.addMemecoin(source, memecoin) then
        Chips.add(source, chips)
        return nil, 'Could not return memecoin'
    end
    return {
        memecoin = Chips.getMemecoin(source),
        chips = Chips.get(source),
        converted = memecoin,
        credited = chips
    }
end

CreateThread(function()
    load()
end)
