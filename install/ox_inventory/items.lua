-- Paste these entries into ox_inventory/data/items.lua
-- Copy html/img/logo-mark.png to ox_inventory/web/images/gambling_tablet.png
-- Copy html/img/logo-mark.png to ox_inventory/web/images/memecoin.png (or use your crypto icon)

['gambling_tablet'] = {
    label = 'Dreams Tablet',
    weight = 380,
    stack = false,
    close = true,
    consume = 0,
    description = 'City of Dreams house tablet. Convert memecoin into chips and play the tables.',
    client = {
        export = 'djfivem_gambling.useTablet',
        image = 'gambling_tablet.png',
        usetime = 250
    }
},

['memecoin'] = {
    label = 'Memecoin',
    weight = 0,
    stack = true,
    close = false,
    description = 'City of Dreams crypto. Convert it on the gambling tablet into chips.',
},
