/**
 * ২৯ কার্ড গেম — Gameplay UI
 * Manages the rendering and interaction for the gameplay screen.
 */
const GameplayUI = (() => {

    const { getTeam, POINT_VALUES, STRENGTH } = GameEngine;
    const { delay, dealCard, playCardToTrick, collectTrick, showFloatingScore } = Animations;

    let gameState = null;
    let localPlayerIndex = 0; // Usually 0 (bottom)

    // DOM Elements
    let tableEl, playersEl, handEl, trickAreaEl, bidPanelEl, trumpIndicatorEl;
    let teamAScoreEl, teamBScoreEl;
    
    function init(state, playerIndex) {
        gameState = state;
        localPlayerIndex = playerIndex;
        
        // Find elements
        tableEl = document.querySelector('.game-table');
        trickAreaEl = document.querySelector('.trick-area');
        handEl = document.querySelector('.player-hand');
        
        // We'll create dynamic elements inside these
        
        renderTable();
        renderHand();
        updateScores();
    }

    // ---- Rendering ----

    function getRelativePosition(absoluteIndex, localIndex) {
        const diff = (absoluteIndex - localIndex + 4) % 4;
        const positions = ['bottom', 'right', 'top', 'left'];
        return positions[diff];
    }

    function renderTable() {
        if (!tableEl) return;
        
        // Clear old players
        document.querySelectorAll('.player-seat').forEach(el => el.remove());
        
        // Render 4 players
        for (let i = 0; i < 4; i++) {
            const pos = getRelativePosition(i, localPlayerIndex);
            createPlayerSeat(i, pos);
        }

        renderTrick();
        renderBidPanel();
        renderTrumpIndicator();
    }

    function createPlayerSeat(playerIndex, position) {
        const seat = document.createElement('div');
        seat.className = `player-seat ${position}`;
        seat.id = `player-seat-${playerIndex}`;
        
        const avatar = document.createElement('div');
        avatar.className = `player-avatar-game ${gameState.currentPlayer === playerIndex ? 'active-turn' : ''}`;
        
        // Get name and emoji
        let name, emoji;
        if (playerIndex === localPlayerIndex) {
            name = Storage.getProfile().name;
            emoji = Storage.getProfile().avatarEmoji || '👤';
        } else {
            const fakeNames = { 'right': 'রাকিব', 'top': 'পার্টনার', 'left': 'সাকিব' };
            const fakeEmojis = { 'right': '😎', 'top': '🤝', 'left': '😤' };
            const indices = { 'right': 1, 'top': 2, 'left': 3 };
            
            if (gameState.config.playerNames) {
                name = gameState.config.playerNames[indices[position]] || fakeNames[position];
            } else {
                name = fakeNames[position];
            }
            
            if (gameState.config.playerAvatars) {
                emoji = gameState.config.playerAvatars[indices[position]] || fakeEmojis[position];
            } else {
                emoji = fakeEmojis[position];
            }
        }

        avatar.innerHTML = `
            ${emoji}
            <div class="timer-ring" style="display: ${gameState.currentPlayer === playerIndex ? 'block' : 'none'}"></div>
        `;
        
        if (gameState.currentPlayer === playerIndex) {
            const thinkingTag = document.createElement('div');
            thinkingTag.style.position = 'absolute';
            thinkingTag.style.bottom = '-12px';
            thinkingTag.style.left = '50%';
            thinkingTag.style.transform = 'translateX(-50%)';
            thinkingTag.style.background = 'rgba(0,0,0,0.7)';
            thinkingTag.style.border = '1px solid var(--gold-primary)';
            thinkingTag.style.color = 'var(--gold-light)';
            thinkingTag.style.fontSize = '10px';
            thinkingTag.style.padding = '2px 8px';
            thinkingTag.style.borderRadius = '10px';
            thinkingTag.style.whiteSpace = 'nowrap';
            thinkingTag.style.zIndex = '10';
            thinkingTag.style.animation = 'pulse 1.5s infinite';
            thinkingTag.innerText = 'ভাবছে...';
            avatar.appendChild(thinkingTag);
        }
        
        if (gameState.dealer === playerIndex) {
            avatar.innerHTML += `<div class="dealer-badge">D</div>`;
        }

        const nameLabel = document.createElement('div');
        nameLabel.className = 'player-name-game';
        nameLabel.innerText = name;
        
        // Determine what bid to show on the avatar
        let bidToShow = null;
        if (gameState.phase === 'bidding') {
            if (gameState.bidPassed[playerIndex]) {
                bidToShow = 'পাস';
            } else if (gameState.bids[playerIndex] !== null && gameState.bids[playerIndex] !== undefined) {
                bidToShow = gameState.bids[playerIndex];
            }
        } else if (gameState.phase !== 'bidding' && gameState.highestBidder === playerIndex && gameState.highestBid > 0) {
            bidToShow = gameState.highestBid;
        }

        if (bidToShow !== null) {
            const bidTag = document.createElement('div');
            bidTag.style.position = 'absolute';
            bidTag.style.top = '-10px';
            bidTag.style.right = '-10px';
            bidTag.style.background = 'var(--bg-glass)';
            bidTag.style.border = '1px solid var(--gold-primary)';
            bidTag.style.color = 'var(--gold-light)';
            bidTag.style.fontSize = '12px';
            bidTag.style.fontWeight = 'bold';
            bidTag.style.padding = '2px 6px';
            bidTag.style.borderRadius = '10px';
            bidTag.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
            bidTag.innerText = bidToShow === 28 ? '28' : bidToShow;
            if (bidToShow === 'পাস') {
                bidTag.style.color = '#aaaaaa';
                bidTag.style.borderColor = '#aaaaaa';
                bidTag.style.background = 'rgba(0,0,0,0.7)';
            }
            avatar.appendChild(bidTag);
        }

        seat.appendChild(avatar);
        seat.appendChild(nameLabel);
        
        const felt = document.querySelector('.table-felt');
        if (felt) felt.appendChild(seat);
    }

    function renderHand() {
        if (!handEl) return;
        handEl.innerHTML = '';
        
        if (gameState.config.gameMode === 'local') {
             // In local mode, only show hand if it's the current player's turn to act
             // This logic will be managed by App controller
        }

        const hand = gameState.hands[localPlayerIndex] || [];
        const validCards = GameEngine.getValidCards(gameState, localPlayerIndex);
        
        hand.forEach((card, i) => {
            const cardEl = document.createElement('div');
            cardEl.className = `hand-card ${card.isRed ? 'red' : 'black'}`;
            cardEl.id = `hand-card-${card.id}`;
            
            // Allow clicking only if it's player's turn in playing phase and card is valid
            const isMyTurn = gameState.currentPlayer === localPlayerIndex;
            const isPlayingPhase = gameState.phase === 'playing';
            const isValid = validCards.some(c => c.id === card.id);
            
            if (!isMyTurn || !isPlayingPhase || !isValid) {
                cardEl.style.filter = 'brightness(0.6)';
                if (!isValid && isPlayingPhase && isMyTurn) {
                     cardEl.style.cursor = 'not-allowed';
                }
            }
            
            cardEl.innerHTML = `
                <div class="hc-rank">${card.rank}</div>
                <div class="hc-suit">${card.suit}</div>
            `;
            
            cardEl.onclick = () => {
                if (isMyTurn && isPlayingPhase && isValid) {
                    App.handlePlayerAction('play_card', card.id);
                }
            };
            
            handEl.appendChild(cardEl);
        });
    }

    function renderTrick() {
        if (!trickAreaEl) return;
        trickAreaEl.innerHTML = '';
        
        gameState.currentTrick.forEach((trickInfo, index) => {
            const card = trickInfo.card;
            const playerPos = getRelativePosition(trickInfo.player, localPlayerIndex);
            
            const cardEl = document.createElement('div');
            cardEl.className = `trick-card ${card.isRed ? 'red' : 'black'}`;
            
            cardEl.innerHTML = `${card.rank}<br>${card.suit}`;
            
            // Style based on who played it (rough approximation)
            let tx = 0, ty = 0, rot = 0;
            switch (playerPos) {
                case 'bottom': ty = 15; rot = -5; break;
                case 'top': ty = -15; rot = 5; break;
                case 'left': tx = -15; rot = -15; break;
                case 'right': tx = 15; rot = 15; break;
            }
            // Add slight randomness based on index to spread them out
            tx += (index - 1) * 5;
            rot += (index - 1) * 3;
            
            cardEl.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
            
            trickAreaEl.appendChild(cardEl);
        });
    }

    function renderBidPanel() {
        // We no longer render a separate bid panel. The winning bid is now shown directly on the highest bidder's avatar.
        const oldPanel = document.querySelector('.bid-panel');
        if (oldPanel) oldPanel.remove();
    }

    function renderTrumpIndicator() {
        const felt = document.querySelector('.table-felt');
        if (!felt) return;
        
        const oldInd = document.querySelector('.trump-container');
        if (oldInd) oldInd.remove();
        
        if (gameState.trumpRevealed) {
            const ind = document.createElement('div');
            ind.className = 'trump-container';
            const isRed = gameState.trump === '♥' || gameState.trump === '♦';
            ind.innerHTML = `
                <div class="trump-label">ট্রাম্প</div>
                <div class="trump-card ${isRed ? 'red' : 'black'}">
                    <div class="tc-suit">${gameState.trump}</div>
                </div>
            `;
            felt.appendChild(ind);
        } else if (gameState.trump) {
            const ind = document.createElement('div');
            ind.className = 'trump-container';
            ind.innerHTML = `
                <div class="trump-label">ট্রাম্প</div>
                <div class="trump-card hidden"></div>
            `;
            felt.appendChild(ind);
        }
    }

    function updateScores() {
        const myTeam = GameEngine.getTeam(localPlayerIndex);
        
        const myTeamScore = myTeam === 'A' ? gameState.teamAScore : gameState.teamBScore;
        const oppTeamScore = myTeam === 'A' ? gameState.teamBScore : gameState.teamAScore;
        
        const chipA = document.querySelector('.score-chip.team-a');
        const chipB = document.querySelector('.score-chip.team-b');
        
        if (chipA) chipA.innerText = `আমরা: ${myTeamScore}/29`;
        if (chipB) chipB.innerText = `তারা: ${oppTeamScore}/29`;

        // Also update round scores if visible somewhere (could add to UI)
    }

    // ---- Bidding UI ----

    function showBiddingUI(minBid) {
        const bottomBar = document.querySelector('.game-bottom-bar');
        if (!bottomBar) return;
        
        bottomBar.innerHTML = '';
        
        const passBtn = document.createElement('button');
        passBtn.className = 'game-btn secondary';
        passBtn.innerText = 'পাস';
        passBtn.onclick = () => App.handlePlayerAction('bid', null);
        bottomBar.appendChild(passBtn);
        
        // Show valid bids (up to 3 next values + 28)
        let count = 0;
        for (let i = minBid; i <= 28 && count < 3; i++) {
            const bidBtn = document.createElement('button');
            bidBtn.className = 'game-btn primary';
            bidBtn.innerText = i;
            bidBtn.onclick = () => App.handlePlayerAction('bid', i);
            bottomBar.appendChild(bidBtn);
            count++;
        }
        
        if (minBid < 28 && count === 3) {
             const maxBtn = document.createElement('button');
             maxBtn.className = 'game-btn primary';
             maxBtn.innerText = '28';
             maxBtn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
             maxBtn.style.color = 'white';
             maxBtn.onclick = () => App.handlePlayerAction('bid', 28);
             bottomBar.appendChild(maxBtn);
        }
    }

    function hideBiddingUI() {
        const bottomBar = document.querySelector('.game-bottom-bar');
        if (bottomBar) bottomBar.innerHTML = '';
    }

    function showTrumpSelectionUI() {
        const bottomBar = document.querySelector('.game-bottom-bar');
        if (!bottomBar) return;
        
        bottomBar.innerHTML = '<div style="color:var(--gold-light); font-size:12px; align-self:center; margin-right:10px;">ট্রাম্প নির্বাচন করুন:</div>';
        
        const suits = ['♠', '♥', '♦', '♣'];
        suits.forEach(suit => {
            const btn = document.createElement('button');
            btn.className = 'game-btn primary';
            btn.style.fontSize = '20px';
            btn.style.padding = '4px 16px';
            const isRed = suit === '♥' || suit === '♦';
            btn.style.color = isRed ? '#e74c3c' : '#1a0f00';
            btn.innerText = suit;
            btn.onclick = () => App.handlePlayerAction('set_trump', suit);
            bottomBar.appendChild(btn);
        });
    }

    return {
        init,
        renderTable,
        renderHand,
        renderTrick,
        updateScores,
        showBiddingUI,
        hideBiddingUI,
        showTrumpSelectionUI,
        getRelativePosition
    };
})();
