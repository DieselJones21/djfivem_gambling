local open = false
local pending = nil

local function send(action, data)
    data = data or {}
    data.action = action
    SendNUIMessage(data)
end

local function setFocus(state)
    SetNuiFocus(state, state)
    SetNuiFocusKeepInput(false)
end

local function closeTablet()
    if not open then
        return
    end
    open = false
    pending = nil
    setFocus(false)
    send('close')
end

local function openTablet(payload)
    open = true
    setFocus(true)
    payload.action = 'open'
    SendNUIMessage(payload)
end

RegisterNetEvent('djfivem_gambling:client:open', function(payload)
    openTablet(payload)
end)

RegisterNetEvent('djfivem_gambling:client:result', function(result)
    local resolve = pending
    pending = nil
    if resolve then
        resolve(result)
    else
        send('result', { result = result })
    end
end)

local function request(action, data)
    local p = promise.new()
    pending = function(result)
        p:resolve(result)
    end
    TriggerServerEvent('djfivem_gambling:server:play', action, data or {})

    SetTimeout(8000, function()
        if pending then
            pending({ ok = false, error = 'Request timed out' })
            pending = nil
        end
    end)

    return Citizen.Await(p)
end

RegisterNUICallback('close', function(_, cb)
    closeTablet()
    cb({ ok = true })
end)

RegisterNUICallback('play', function(body, cb)
    local action = body and body.action
    if not action then
        cb({ ok = false, error = 'Missing action' })
        return
    end
    cb(request(action, body.data or {}))
end)

RegisterCommand(Config.OpenCommand or 'gambling', function()
    if open then
        closeTablet()
        return
    end
    TriggerServerEvent('djfivem_gambling:server:open')
end, false)

if Config.OpenKey then
    RegisterKeyMapping(Config.OpenCommand or 'gambling', 'Open gambling tablet', 'keyboard', Config.OpenKey)
end

local function requestOpen()
    if open then
        return
    end
    TriggerServerEvent('djfivem_gambling:server:open')
end

RegisterNetEvent('djfivem_gambling:client:useItem', function()
    requestOpen()
end)

RegisterNetEvent('djfivem_gambling:client:notify', function(message)
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName(message or 'House Tablet')
    EndTextCommandThefeedPostTicker(false, true)
end)

exports('useTablet', function()
    requestOpen()
end)

if Config.UseItem then
    CreateThread(function()
        if GetResourceState('qb-core') == 'started' then
            local QBCore = exports['qb-core']:GetCoreObject()
            if QBCore and QBCore.Functions.CreateUseableItem then
                -- server-side usable items are preferred; this is a fallback hook
            end
        end
    end)
end

AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then
        closeTablet()
    end
end)

exports('open', function()
    TriggerServerEvent('djfivem_gambling:server:open')
end)

exports('close', closeTablet)
