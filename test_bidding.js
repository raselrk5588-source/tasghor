const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <div id="gameplay">
        <div class="game-bottom-bar"></div>
        <div class="game-table">
            <div class="table-felt"></div>
        </div>
        <div class="player-hand"></div>
        <div class="trick-area"></div>
        <div class="score-chip team-a"></div>
        <div class="score-chip team-b"></div>
    </div>
</body></html>`, {
    url: "http://localhost"
});
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;

// Mock Firebase
global.firebase = {
    apps: [1],
    database: () => ({
        ref: () => ({
            on: () => {},
            update: () => {},
            push: () => {},
            remove: () => {},
            onDisconnect: () => ({ remove: () => {} })
        }),
        ServerValue: { TIMESTAMP: 12345 }
    })
};

const GameEngine = eval(fs.readFileSync('e:/Project24/29Card/js/game-engine.js', 'utf8') + '\nGameEngine;');
global.GameEngine = GameEngine;

const BotAI = eval(fs.readFileSync('e:/Project24/29Card/js/bot-ai.js', 'utf8') + '\nBotAI;');
global.BotAI = BotAI;

const Storage = eval(fs.readFileSync('e:/Project24/29Card/js/storage.js', 'utf8') + '\nStorage;');
global.Storage = Storage;

const FirebaseManagerStr = fs.readFileSync('e:/Project24/29Card/js/firebase-config.js', 'utf8');
const FirebaseManager = eval('(' + FirebaseManagerStr.replace('const FirebaseManager =', '') + ')');
global.FirebaseManager = FirebaseManager;

const Animations = {
    showFloatingScore: () => {}
};
global.Animations = Animations;

const GameplayUI = eval(fs.readFileSync('e:/Project24/29Card/js/gameplay-ui.js', 'utf8') + '\nGameplayUI;');
global.GameplayUI = GameplayUI;

const AppStr = fs.readFileSync('e:/Project24/29Card/js/app.js', 'utf8');
const App = eval(AppStr + '\nApp;');
global.App = App;

try {
    App.init();

    // Mock state as if joining
    let state = GameEngine.createGameState({
        gameMode: 'online',
        botDifficulty: 'medium',
        targetScore: 29,
        initialDealer: 3, // host is dealer, def is 1
        hostPhone: '12345',
        myAbsoluteIndex: 1, // 'def' is absolute index 1
        playerNames: ['def', 'Hasan (Bot)', 'Rahim (Bot)', 'abc'], // Relative names
        playerAvatars: ['👤', '🤖', '🤖', '👤']
    });
    state = GameEngine.dealFirstFour(state);

    GameplayUI.init(state, 0);
    // processBiddingPhase is internal, but startRound calls it
    // Wait, let's just trigger what happens when it's our turn
    App.handlePlayerAction('bid', 16);
    
    console.log("Success! Current Player:", state.currentPlayer);
    console.log("Active bidders:", state.bids);

} catch(e) {
    console.error("CRASHED:", e);
}
