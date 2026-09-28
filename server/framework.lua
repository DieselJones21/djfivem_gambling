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

function Framework.hasInventory()
    if GetResourceState('ox_inventory') == 'started' then
        return true
    end
    return Framework.name == 'qb' or Framework.name == 'qbx' or Framework.name == 'esx'
end

function Framework.getItemCount(source, item)
    if not item then
        return 0
    end

    if GetResourceState('ox_inventory') == 'started' then
        local count
        if exports.ox_inventory.GetItemCount then
            count = exports.ox_inventory:GetItemCount(source, item)
        else
            count = exports.ox_inventory:Search(source, 'count', item)
        end
        return tonumber(count) or 0
    end

    if Framework.name == 'qb' or Framework.name == 'qbx' then
        local player = Framework.core and Framework.core.Functions.GetPlayer(source)
        local data = player and player.Functions.GetItemByName(item)
        return data and tonumber(data.amount or data.count or 0) or 0
    end

    if Framework.name == 'esx' then
        local player = Framework.core.GetPlayerFromId(source)
        local data = player and player.getInventoryItem(item)
        return data and tonumber(data.count or data.amount or 0) or 0
    end

    return 0
end

function Framework.hasItem(source, item)
    if not Framework.hasInventory() then
        return true
    end
    return Framework.getItemCount(source, item) > 0
end

function Framework.removeItem(source, item, amount)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 then
        return false
    end
    if Framework.getItemCount(source, item) < amount then
        return false
    end

    if GetResourceState('ox_inventory') == 'started' then
        local before = Framework.getItemCount(source, item)
        if before < amount then
            return false
        end
        exports.ox_inventory:RemoveItem(source, item, amount)
        return Framework.getItemCount(source, item) <= before - amount
    end

    if Framework.name == 'qb' or Framework.name == 'qbx' then
        local player = Framework.core and Framework.core.Functions.GetPlayer(source)
        if not player then
            return false
        end
        player.Functions.RemoveItem(item, amount)
        return true
    end

    if Framework.name == 'esx' then
        local player = Framework.core.GetPlayerFromId(source)
        if not player then
            return false
        end
        player.removeInventoryItem(item, amount)
        return true
    end

    return false
end

function Framework.addItem(source, item, amount)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 then
        return false
    end

    if GetResourceState('ox_inventory') == 'started' then
        local added = exports.ox_inventory:AddItem(source, item, amount)
        return added == true or type(added) == 'table'
    end

    if Framework.name == 'qb' or Framework.name == 'qbx' then
        local player = Framework.core and Framework.core.Functions.GetPlayer(source)
        if not player then
            return false
        end
        return player.Functions.AddItem(item, amount) ~= false
    end

    if Framework.name == 'esx' then
        local player = Framework.core.GetPlayerFromId(source)
        if not player then
            return false
        end
        player.addInventoryItem(item, amount)
        return true
    end

    return false
end

local function resolveAccount(name)
    if Framework.name == 'esx' and (name == 'cash' or name == nil) then
        return 'money'
    end
    return name or accountName()
end

function Framework.getAccountMoney(source, name)
    name = resolveAccount(name)
    if Framework.name == 'qb' or Framework.name == 'qbx' then
        local player = Framework.core and Framework.core.Functions.GetPlayer(source)
        if not player then
            return 0
        end
        return player.Functions.GetMoney(name) or 0
    end
    if Framework.name == 'esx' then
        local player = Framework.core.GetPlayerFromId(source)
        if not player then
            return 0
        end
        local account = player.getAccount(name)
        return account and account.money or 0
    end
    return Framework.getBalance(source)
end

function Framework.removeAccountMoney(source, name, amount)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 then
        return false
    end
    name = resolveAccount(name)
    if Framework.getAccountMoney(source, name) < amount then
        return false
    end

    if Framework.name == 'qb' or Framework.name == 'qbx' then
        local player = Framework.core and Framework.core.Functions.GetPlayer(source)
        if not player then
            return false
        end
        player.Functions.RemoveMoney(name, amount, 'gambling-tablet-memecoin')
        return true
    end
    if Framework.name == 'esx' then
        local player = Framework.core.GetPlayerFromId(source)
        if not player then
            return false
        end
        player.removeAccountMoney(name, amount)
        return true
    end
    return Framework.removeMoney(source, amount)
end

function Framework.addAccountMoney(source, name, amount)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 then
        return
    end
    name = resolveAccount(name)
    if Framework.name == 'qb' or Framework.name == 'qbx' then
        local player = Framework.core and Framework.core.Functions.GetPlayer(source)
        if player then
            player.Functions.AddMoney(name, amount, 'gambling-tablet-memecoin')
        end
        return
    end
    if Framework.name == 'esx' then
        local player = Framework.core.GetPlayerFromId(source)
        if player then
            player.addAccountMoney(name, amount)
        end
        return
    end
    Framework.addMoney(source, amount)
end
