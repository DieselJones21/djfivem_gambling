Framework = {
    name = Config.Framework,
    core = nil
}

local function detectFramework()
    if Config.Framework ~= 'standalone' then
        return Config.Framework
    end

    if GetResourceState('qbx_core') == 'started' then
        return 'qbx'
    end
    if GetResourceState('qb-core') == 'started' then
        return 'qb'
    end
    if GetResourceState('es_extended') == 'started' then
        return 'esx'
    end
    return 'standalone'
end

function Framework.setup()
    Framework.name = detectFramework()

    if Framework.name == 'qb' or Framework.name == 'qbx' then
        Framework.core = exports['qb-core'] and exports['qb-core']:GetCoreObject() or nil
        if not Framework.core and Framework.name == 'qbx' then
            Framework.core = exports['qbx_core']
        end
    elseif Framework.name == 'esx' then
        Framework.core = exports['es_extended']:getSharedObject()
    end
end

local standalone = {}

local function standaloneKey(source)
    local license = GetPlayerIdentifierByType(source, 'license')
    return license or ('src:%s'):format(source)
end

function Framework.playerName(source)
    return GetPlayerName(source) or ('ID %s'):format(source)
end

local function accountName()
    if Framework.name == 'esx' and Config.Account == 'cash' then
        return 'money'
    end
    return Config.Account
end

function Framework.getBalance(source)
    if Framework.name == 'qb' or Framework.name == 'qbx' then
        local player = Framework.core and Framework.core.Functions.GetPlayer(source)
        if not player then
            return 0
        end
        return player.Functions.GetMoney(accountName()) or 0
    end

    if Framework.name == 'esx' then
        local player = Framework.core.GetPlayerFromId(source)
        if not player then
            return 0
        end
        return player.getAccount(accountName()).money or 0
    end

    local key = standaloneKey(source)
    if standalone[key] == nil then
        standalone[key] = Config.StartingBalance
    end
    return standalone[key]
end

function Framework.removeMoney(source, amount)
    amount = math.floor(amount)
    if amount <= 0 then
        return false
    end

    if Framework.name == 'qb' or Framework.name == 'qbx' then
        local player = Framework.core and Framework.core.Functions.GetPlayer(source)
        if not player or (player.Functions.GetMoney(accountName()) or 0) < amount then
            return false
        end
        player.Functions.RemoveMoney(accountName(), amount, 'gambling-tablet-bet')
        return true
    end

    if Framework.name == 'esx' then
        local player = Framework.core.GetPlayerFromId(source)
        if not player or (player.getAccount(accountName()).money or 0) < amount then
            return false
        end
        player.removeAccountMoney(accountName(), amount)
        return true
    end

    local key = standaloneKey(source)
    local balance = Framework.getBalance(source)
    if balance < amount then
        return false
    end
    standalone[key] = balance - amount
    return true
end

function Framework.addMoney(source, amount)
    amount = math.floor(amount)
    if amount <= 0 then
        return
    end

    if Framework.name == 'qb' or Framework.name == 'qbx' then
        local player = Framework.core and Framework.core.Functions.GetPlayer(source)
        if player then
            player.Functions.AddMoney(accountName(), amount, 'gambling-tablet-win')
        end
        return
    end

    if Framework.name == 'esx' then
        local player = Framework.core.GetPlayerFromId(source)
        if player then
            player.addAccountMoney(accountName(), amount)
        end
        return
    end

    local key = standaloneKey(source)
    standalone[key] = Framework.getBalance(source) + amount
end
