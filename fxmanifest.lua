fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'djfivem_gambling'
author 'DieselJones'
description 'Envy Roleplay gambling tablet with configurable odds and payouts'
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
    'html/img/envy-mark.png',
    'html/js/*.js',
    'html/js/games/*.js'
}

provide 'djfivem_gambling'
