/**
 * ২৯ কার্ড গেম — Game Engine
 * Complete 29 card game rules: deck, dealing, bidding, tricks, scoring.
 */
const GameEngine = (() => {

    // ---- Constants ----

    const SUITS = ['♠', '♥', '♦', '♣'];
    const SUIT_NAMES = { '♠': 'স্পেডস', '♥': 'হার্টস', '♦': 'ডায়মন্ডস', '♣': 'ক্লাবস' };
    const SUIT_NAMES_EN = { '♠': 'Spades', '♥': 'Hearts', '♦': 'Diamonds', '♣': 'Clubs' };
    const RANKS = ['J', '9', 'A', '10', 'K', 'Q', '8', '7']; // Strength order (strongest first)

    // Point values for each rank
    const POINT_VALUES = { 'J': 3, '9': 2, 'A': 1, '10': 1, 'K': 0, 'Q': 0, '8': 0, '7': 0 };

    // Card strength (higher = stronger within same suit)
    const STRENGTH = { 'J': 8, '9': 7, 'A': 6, '10': 5, 'K': 4, 'Q': 3, '8': 2, '7': 1 };

    // Positions: 0=Bottom(You), 1=Right(Opp1), 2=Top(Partner), 3=Left(Opp2)
    // Teams: Team A = [0, 2] (You + Partner), Team B = [1, 3] (Opponents)
    const POSITIONS = ['bottom', 'right', 'top', 'left'];
    const TEAM_A = [0, 2];
    const TEAM_B = [1, 3];

    // ---- Card Object ----

    function createCard(rank, suit) {
        return {
            rank,
            suit,
            points: POINT_VALUES[rank],
            strength: STRENGTH[rank],
            id: `${rank}${suit}`,
            isRed: suit === '♥' || suit === '♦',
        };
    }

    // ---- Deck ----

    function createDeck() {
        const deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push(createCard(rank, suit));
            }
        }
        return deck;
    }

    function shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // ---- Game State ----

    function createGameState(config = {}) {
        return {
            // Configuration
            config: {
                targetScore: config.targetScore || 29,
                botDifficulty: config.botDifficulty || 'medium',
                gameMode: config.gameMode || 'bot', // 'bot', 'local', 'online'
                bestOf: config.bestOf || 3,
                playerNames: config.playerNames || null,
                playerAvatars: config.playerAvatars || null,
                initialDeck: config.initialDeck || null,
                isHost: config.isHost !== undefined ? config.isHost : true,
                hostPhone: config.hostPhone || null,
                myAbsoluteIndex: config.myAbsoluteIndex || 0,
                sourceScreen: config.sourceScreen || 'home'
            },

            // Game state
            phase: 'idle', // idle, dealing-first, bidding, dealing-second, trump-select, playing, round-end, game-over
            deck: [],
            hands: [[], [], [], []], // 4 players
            
            // Round state
            dealer: config.initialDealer !== undefined ? config.initialDealer : 0, // who deals (rotates)
            currentPlayer: 0, // whose turn
            
            // Bidding
            bids: [null, null, null, null], // each player's last bid
            highestBid: 0,
            highestBidder: -1,
            bidPassed: [false, false, false, false],
            bidStartPlayer: 0,
            
            // Trump
            trump: null, // suit
            trumpRevealed: false,
            trumpCaller: -1,
            
            // Trick
            currentTrick: [], // { card, player }
            trickLeader: 0, // who led this trick
            tricksPlayed: 0,
            
            // Scoring
            teamAScore: 0, // tricks points for team A this round
            teamBScore: 0,
            teamATricks: 0,
            teamBTricks: 0,
            
            // Overall game score
            teamAGameScore: 0,
            teamBGameScore: 0,
            roundsPlayed: 0,
            
            // History for card counting
            playedCards: [],
            trickHistory: [], // completed tricks

            // Animation queue
            animationQueue: [],

            // Local multiplayer
            localCurrentViewer: 0, // who's looking at screen in pass & play
        };
    }

    // ---- Dealing ----

    function dealFirstFour(state) {
        if (state.config.initialDeck && state.config.initialDeck.length === 32) {
            state.deck = [...state.config.initialDeck];
        } else {
            state.deck = shuffleDeck(createDeck());
        }
        
        state.hands = [[], [], [], []];
        state.playedCards = [];
        state.trickHistory = [];
        state.currentTrick = [];
        state.tricksPlayed = 0;
        state.teamAScore = 0;
        state.teamBScore = 0;
        state.teamATricks = 0;
        state.teamBTricks = 0;
        state.trump = null;
        state.trumpRevealed = false;
        state.bids = [null, null, null, null];
        state.bidPassed = [false, false, false, false];
        state.highestBid = 0;
        state.highestBidder = -1;

        // Deal 4 cards to each player
        for (let round = 0; round < 4; round++) {
            for (let p = 0; p < 4; p++) {
                const dealTo = (state.dealer + 1 + p) % 4;
                state.hands[dealTo].push(state.deck.pop());
            }
        }

        state.bidStartPlayer = (state.dealer + 1) % 4;
        state.currentPlayer = state.bidStartPlayer;
        state.phase = 'bidding';

        return state;
    }

    function dealSecondFour(state) {
        // Deal remaining 4 cards to each player
        for (let round = 0; round < 4; round++) {
            for (let p = 0; p < 4; p++) {
                const dealTo = (state.dealer + 1 + p) % 4;
                state.hands[dealTo].push(state.deck.pop());
            }
        }

        // Sort hands
        for (let p = 0; p < 4; p++) {
            state.hands[p] = sortHand(state.hands[p]);
        }

        state.phase = 'trump-select';
        state.currentPlayer = state.highestBidder;

        return state;
    }

    // ---- Sort hand by suit then strength ----

    function sortHand(hand) {
        const suitOrder = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };
        return [...hand].sort((a, b) => {
            if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                return suitOrder[a.suit] - suitOrder[b.suit];
            }
            return b.strength - a.strength;
        });
    }

    // ---- Bidding ----

    function canBid(state, playerIndex) {
        return state.phase === 'bidding' &&
               state.currentPlayer === playerIndex &&
               !state.bidPassed[playerIndex];
    }

    function placeBid(state, playerIndex, bidValue) {
        if (!canBid(state, playerIndex)) return { success: false, error: 'Not your turn to bid' };

        if (bidValue !== null && bidValue !== undefined) {
            // Bidding
            const minBid = state.highestBid > 0 ? state.highestBid + 1 : 15;
            if (bidValue < minBid || bidValue > 28) {
                return { success: false, error: `Bid must be between ${minBid} and 28` };
            }
            state.bids[playerIndex] = bidValue;
            state.highestBid = bidValue;
            state.highestBidder = playerIndex;
        } else {
            // Pass
            state.bidPassed[playerIndex] = true;
        }

        // Find next bidder
        const activeBidders = [0, 1, 2, 3].filter(p => !state.bidPassed[p]);
        
        if (activeBidders.length === 1 && state.highestBid >= 15) {
            // Only one bidder left and there's a valid bid - they win
            state.highestBidder = activeBidders[0];
            state.trumpCaller = state.highestBidder;
            
            // Deal second batch
            return { success: true, biddingComplete: true };
        }

        if (activeBidders.length === 0) {
            // Everyone passed - re-deal
            if (state.highestBid < 15) {
                return { success: true, redeal: true };
            }
            state.trumpCaller = state.highestBidder;
            return { success: true, biddingComplete: true };
        }

        // If bid is 28 (max), bidding ends
        if (bidValue === 28) {
            state.trumpCaller = playerIndex;
            return { success: true, biddingComplete: true };
        }

        // Move to next active player
        let next = (playerIndex + 1) % 4;
        while (state.bidPassed[next]) {
            next = (next + 1) % 4;
        }
        state.currentPlayer = next;

        return { success: true, biddingComplete: false };
    }

    // ---- Trump Selection ----

    function selectTrump(state, suit) {
        if (state.phase !== 'trump-select') return false;
        state.trump = suit;
        state.trumpRevealed = false;
        state.phase = 'playing';
        state.trickLeader = (state.dealer + 1) % 4;
        state.currentPlayer = state.trickLeader;
        return true;
    }

    function revealTrump(state) {
        state.trumpRevealed = true;
        
        // Check for Pair (Marriage)
        for (let i = 0; i < 4; i++) {
            const hand = state.hands[i];
            const hasK = hand.find(c => c.rank === 'K' && c.suit === state.trump);
            const hasQ = hand.find(c => c.rank === 'Q' && c.suit === state.trump);
            
            if (hasK && hasQ) {
                state.pairTeam = TEAM_A.includes(i) ? 'A' : 'B';
                state.pairShown = true;
                break;
            }
        }
        
        return state.trump;
    }

    // ---- Playing Cards ----

    function getValidCards(state, playerIndex) {
        const hand = state.hands[playerIndex];
        if (state.currentTrick.length === 0) {
            // Leading: can play any card
            return hand;
        }

        const leadSuit = state.currentTrick[0].card.suit;
        const suitCards = hand.filter(c => c.suit === leadSuit);

        if (suitCards.length > 0) {
            // Must follow suit
            return suitCards;
        }

        // Can't follow suit
        // If trump is not revealed and this player is the trump caller,
        // they can reveal trump (forced if they want to play trump)
        // For simplicity: if can't follow suit, can play anything
        return hand;
    }

    function playCard(state, playerIndex, cardId) {
        if (state.phase !== 'playing' || state.currentPlayer !== playerIndex) {
            return { success: false, error: 'Not your turn' };
        }

        const hand = state.hands[playerIndex];
        const cardIndex = hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) {
            return { success: false, error: 'Card not in hand' };
        }

        const card = hand[cardIndex];
        const validCards = getValidCards(state, playerIndex);
        if (!validCards.find(c => c.id === cardId)) {
            return { success: false, error: 'Must follow suit' };
        }

        // No auto-reveal in engine anymore! UI and Bots explicitly call reveal_trump

        // Remove card from hand
        hand.splice(cardIndex, 1);

        // Add to trick
        state.currentTrick.push({ card, player: playerIndex });
        state.playedCards.push(card);

        // Check if trick is complete
        if (state.currentTrick.length === 4) {
            return { success: true, trickComplete: true };
        }

        // Move to next player
        state.currentPlayer = (playerIndex + 1) % 4;
        return { success: true, trickComplete: false };
    }

    // ---- Trick Resolution ----

    function resolveTrick(state) {
        const trick = state.currentTrick;
        const leadSuit = trick[0].card.suit;
        let winner = 0;
        let winningCard = trick[0].card;

        for (let i = 1; i < trick.length; i++) {
            const card = trick[i].card;
            
            if (state.trump && state.trumpRevealed && card.suit === state.trump && winningCard.suit !== state.trump) {
                // Trump wins over non-trump (only if revealed!)
                winner = i;
                winningCard = card;
            } else if (card.suit === winningCard.suit && card.strength > winningCard.strength) {
                // Higher card of same suit wins
                winner = i;
                winningCard = card;
            } else if (state.trump && state.trumpRevealed && card.suit === state.trump && winningCard.suit === state.trump && card.strength > winningCard.strength) {
                // Both trump, higher wins
                winner = i;
                winningCard = card;
            }
        }

        const winnerPlayer = trick[winner].player;
        const trickPoints = trick.reduce((sum, t) => sum + t.card.points, 0);

        // Add points to team
        if (TEAM_A.includes(winnerPlayer)) {
            state.teamAScore += trickPoints;
            state.teamATricks++;
        } else {
            state.teamBScore += trickPoints;
            state.teamBTricks++;
        }

        state.tricksPlayed++;

        // Last trick bonus
        if (state.tricksPlayed === 8) {
            if (TEAM_A.includes(winnerPlayer)) {
                state.teamAScore += 1; // Last trick bonus
            } else {
                state.teamBScore += 1;
            }
        }

        // Save trick to history
        state.trickHistory.push({
            cards: [...trick],
            winner: winnerPlayer,
            points: trickPoints,
        });

        // Clear trick
        state.currentTrick = [];

        // Check if round is over
        if (state.tricksPlayed >= 8) {
            return { winner: winnerPlayer, points: trickPoints, roundOver: true };
        }

        // Next trick leader is the winner
        state.trickLeader = winnerPlayer;
        state.currentPlayer = winnerPlayer;

        return { winner: winnerPlayer, points: trickPoints, roundOver: false };
    }

    // ---- Round Resolution ----

    function resolveRound(state) {
        const bidTeam = TEAM_A.includes(state.highestBidder) ? 'A' : 'B';
        const bidTeamScore = bidTeam === 'A' ? state.teamAScore : state.teamBScore;
        const otherTeamScore = bidTeam === 'A' ? state.teamBScore : state.teamAScore;

        let effectiveBid = state.highestBid;
        if (state.pairShown) {
            if (state.pairTeam === bidTeam) {
                effectiveBid -= 4; // Bidding team showed pair, target decreases by 4
            } else {
                effectiveBid += 4; // Defending team showed pair, target increases by 4
            }
        }

        const bidMet = bidTeamScore >= effectiveBid;
        
        let scoreChange = 1; // 1 match point per round

        const result = {
            bidTeam,
            bidMet,
            bidValue: state.highestBid,
            teamAScore: state.teamAScore,
            teamBScore: state.teamBScore,
            teamATricks: state.teamATricks,
            teamBTricks: state.teamBTricks,
        };

        // Update game scores
        if (bidTeam === 'A') {
            if (bidMet) {
                state.teamAGameScore += scoreChange;
            } else {
                state.teamBGameScore += scoreChange;
            }
        } else {
            if (bidMet) {
                state.teamBGameScore += scoreChange;
            } else {
                state.teamAGameScore += scoreChange;
            }
        }

        state.roundsPlayed++;
        result.teamAGameScore = state.teamAGameScore;
        result.teamBGameScore = state.teamBGameScore;

        // Check if game is over (Best of 3 -> first to 2 match points wins)
        const target = 2;
        if (state.teamAGameScore >= target || state.teamBGameScore >= target) {
            state.phase = 'game-over';
            result.gameOver = true;
            result.gameWinner = state.teamAGameScore >= target ? 'A' : 'B';
        } else {
            result.gameOver = false;
            // Rotate dealer
            state.dealer = (state.dealer + 1) % 4;
        }

        return result;
    }

    // ---- Hand Evaluation (for bot AI) ----

    function evaluateHand(hand) {
        let score = 0;
        const suitCounts = {};
        const suitStrength = {};

        for (const card of hand) {
            score += card.points * 2; // Point cards are valuable
            score += card.strength; // High cards are good
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
            suitStrength[card.suit] = (suitStrength[card.suit] || 0) + card.strength;
        }

        // Bonus for long suits (potential trump)
        for (const suit of SUITS) {
            const count = suitCounts[suit] || 0;
            if (count >= 4) score += 8;
            else if (count >= 3) score += 4;
        }

        return {
            score,
            suitCounts,
            suitStrength,
            bestSuit: SUITS.reduce((best, suit) =>
                (suitStrength[suit] || 0) > (suitStrength[best] || 0) ? suit : best, SUITS[0]),
            longestSuit: SUITS.reduce((best, suit) =>
                (suitCounts[suit] || 0) > (suitCounts[best] || 0) ? suit : best, SUITS[0]),
        };
    }

    // ---- Utility ----

    function getTeam(playerIndex) {
        return TEAM_A.includes(playerIndex) ? 'A' : 'B';
    }

    function getPartner(playerIndex) {
        return TEAM_A.includes(playerIndex) ? TEAM_A.find(p => p !== playerIndex) : TEAM_B.find(p => p !== playerIndex);
    }

    function getOpponents(playerIndex) {
        return TEAM_A.includes(playerIndex) ? [...TEAM_B] : [...TEAM_A];
    }

    function getRemainingCards(state) {
        const playedIds = new Set(state.playedCards.map(c => c.id));
        return createDeck().filter(c => !playedIds.has(c.id));
    }

    function getCardsOfSuit(cards, suit) {
        return cards.filter(c => c.suit === suit);
    }

    return {
        SUITS, RANKS, POSITIONS, TEAM_A, TEAM_B,
        POINT_VALUES, STRENGTH, SUIT_NAMES, SUIT_NAMES_EN,
        createCard, createDeck, shuffleDeck, sortHand,
        createGameState, dealFirstFour, dealSecondFour,
        canBid, placeBid,
        selectTrump, revealTrump,
        getValidCards, playCard, resolveTrick, resolveRound,
        evaluateHand, getTeam, getPartner, getOpponents,
        getRemainingCards, getCardsOfSuit,
    };
})();
