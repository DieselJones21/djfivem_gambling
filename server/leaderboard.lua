Leaderboard = {}

local FILE = 'data/leaderboard.json'
local rows = {}

local function size()
    return (Config.Leaderboard and Config.Leaderboard.size) or 10
end

local function persist()
    if Config.Leaderboard and Config.Leaderboard.persist == false then
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

local function ranked(field)
    local list = {}
    for key, row in pairs(rows) do
        local amount = math.floor(row[field] or 0)
        if amount > 0 then
            list[#list + 1] = {
                id = key,
                name = row.name or 'Unknown',
                amount = amount
            }
        end
    end
    table.sort(list, function(a, b)
        if a.amount == b.amount then
            return a.name < b.name
        end
        return a.amount > b.amount
    end)
    return list
end

local function publicList(list, key)
    local out = {}
    local limit = size()
    for i = 1, math.min(limit, #list) do
        out[i] = {
            rank = i,
            name = list[i].name,
            amount = list[i].amount,
            self = list[i].id == key
        }
    end
    return out
end

local function findRank(list, key)
    for i = 1, #list do
        if list[i].id == key then
            return i, list[i].amount
        end
    end
    return nil, 0
end

function Leaderboard.snapshot(source)
    local key = source and playerKey(source) or ''
    local won = ranked('won')
    local lost = ranked('lost')
    local wonRank, wonAmount = findRank(won, key)
    local lostRank, lostAmount = findRank(lost, key)
    local mine = rows[key]
    return {
        won = publicList(won, key),
        lost = publicList(lost, key),
        mine = {
            name = mine and mine.name or Framework.playerName(source),
            won = wonAmount,
            lost = lostAmount,
            wonRank = wonRank,
            lostRank = lostRank
        }
    }
end

function Leaderboard.record(source, profit)
    profit = math.floor(tonumber(profit) or 0)
    if profit == 0 then
        return Leaderboard.snapshot(source)
    end

    local key = playerKey(source)
    local row = rows[key] or { name = Framework.playerName(source), won = 0, lost = 0 }
    row.name = Framework.playerName(source)
    if profit > 0 then
        row.won = (row.won or 0) + profit
    else
        row.lost = (row.lost or 0) + math.abs(profit)
    end
    rows[key] = row
    persist()
    return Leaderboard.snapshot(source)
end

CreateThread(function()
    load()
end)
