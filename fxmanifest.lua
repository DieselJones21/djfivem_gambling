fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'djfivem_gambling'
author 'DieselJones'
description 'The 305 Miami gambling tablet with configurable odds and payouts'
version '1.1.0'

ui_page 'html/index.html'

shared_scripts {
    'config.lua',
    'shared/odds.lua'
}

client_scripts {
    'client/main.lua'
}

server_scripts {
    'server/framework.lua',
    'server/leaderboard.lua',
    'server/games.lua',
    'server/main.lua'
}

files {
    'html/index.html',
    'html/css/tablet.css',
    'html/img/the-305.png',
    'html/js/*.js',
    'html/js/games/*.js'
}

provide 'djfivem_gambling'
