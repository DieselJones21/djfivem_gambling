-- Paste this entry into ox_inventory/data/items.lua
-- Copy install/ox_inventory/gambling_tablet.png into ox_inventory/web/images/

['gambling_tablet'] = {
    label = 'Envy Tablet',
    weight = 380,
    stack = false,
    close = true,
    consume = 0,
    description = 'The Envy Roleplay gambling tablet. Use it to open the house games.',
    client = {
        export = 'djfivem_gambling.useTablet',
        image = 'gambling_tablet.png',
        usetime = 250
    }
},
