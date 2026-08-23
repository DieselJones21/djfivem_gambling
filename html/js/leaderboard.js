export function emptyLeaderboard(name = 'You') {
    return {
        won: [],
        lost: [],
        players: {},
        mine: { name, won: 0, lost: 0, wonRank: null, lostRank: null }
    };
}

function lists(players, selfName, limit) {
    const rank = (field) => Object.values(players)
        .filter((player) => player[field] > 0)
        .sort((a, b) => b[field] - a[field] || a.name.localeCompare(b.name))
        .map((player, index) => ({
            rank: index + 1,
            name: player.name,
            amount: player[field],
            self: player.name === selfName
        }))
        .slice(0, limit);

    return { won: rank('won'), lost: rank('lost') };
}

export function recordLeaderboard(board, name, profit, limit = 10) {
    const next = board || emptyLeaderboard(name);
    next.players = next.players || {};
    const player = next.players[name] || { name, won: 0, lost: 0 };
    const amount = Math.floor(profit);
    if (amount > 0) player.won += amount;
    else if (amount < 0) player.lost += Math.abs(amount);
    next.players[name] = player;

    const ranked = lists(next.players, name, limit);
    next.won = ranked.won;
    next.lost = ranked.lost;
    next.mine = {
        name,
        won: player.won,
        lost: player.lost,
        wonRank: ranked.won.find((row) => row.self)?.rank || null,
        lostRank: ranked.lost.find((row) => row.self)?.rank || null
    };
    return next;
}

export function seedPreviewBoard(name) {
    const board = emptyLeaderboard(name);
    [
        ['Vex', 18420, 2400],
        ['Rook', 9600, 15110],
        ['Sable', 7200, 4100],
        ['Nico', 3100, 8800]
    ].forEach(([player, won, lost]) => {
        if (won) recordLeaderboard(board, player, won);
        if (lost) recordLeaderboard(board, player, -lost);
    });
    return recordLeaderboard(board, name, 0);
}
