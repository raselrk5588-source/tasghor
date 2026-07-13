/**
 * ২৯ কার্ড গেম — Bot AI
 * Evaluates game state and makes decisions for non-player characters.
 * Supports 4 difficulty levels: 'easy', 'medium', 'hard', 'expert'
 */
const BotAI = (() => {

    const { POINT_VALUES, STRENGTH, SUITS, evaluateHand, getValidCards, getPartner } = GameEngine;

    // ---- Main Decision Methods ----

    function getBid(state, playerIndex, difficulty) {
        const hand = state.hands[playerIndex];
        const evalResult = evaluateHand(hand);
        const currentHighest = state.highestBid || 14;

        let maxBid = 15;
        
        switch (difficulty) {
            case 'easy':
                maxBid = 15 + Math.floor(Math.random() * 4); // Bids low
                break;
            case 'medium':
                maxBid = Math.floor(evalResult.score / 2.5) + 12; 
                break;
            case 'hard':
            case 'expert':
                // More precise calculation based on points + high cards + long suit
                let safeBid = 14;
                if (evalResult.score > 25) safeBid = 16;
                if (evalResult.score > 35) safeBid = 18;
                if (evalResult.score > 45) safeBid = 20;
                if (evalResult.score > 55) safeBid = 22;
                maxBid = safeBid + (Math.random() > 0.5 ? 1 : 0);
                break;
        }

        // Add some randomness so bots don't always bid the same
        maxBid += Math.floor(Math.random() * 2) - 1; 

        if (maxBid > 28) maxBid = 28;

        // If partner is currently the highest bidder, only overbid if hand is exceptionally strong
        const partnerIndex = getPartner(playerIndex);
        if (state.highestBidder === partnerIndex) {
            if (maxBid < currentHighest + 4) {
                return null; // Support partner by passing
            }
        }

        if (maxBid > currentHighest && currentHighest < 28) {
            // Determine bid increment
            const increment = difficulty === 'expert' ? (maxBid - currentHighest > 2 ? 2 : 1) : 1;
            let finalBid = currentHighest + increment;
            if (finalBid > 28) finalBid = 28;
            return finalBid;
        }

        return null; // Pass
    }

    function getTrump(state, playerIndex, difficulty) {
        const hand = state.hands[playerIndex];
        const evalResult = evaluateHand(hand);

        if (difficulty === 'easy') {
            return SUITS[Math.floor(Math.random() * SUITS.length)];
        }

        // Return the best suit based on hand evaluation
        return evalResult.bestSuit;
    }

    function getPlayCard(state, playerIndex, difficulty) {
        const validCards = getValidCards(state, playerIndex);
        if (validCards.length === 1) return validCards[0].id; // Only one choice

        const hand = state.hands[playerIndex];
        const trick = state.currentTrick;
        const isLeading = trick.length === 0;

        if (difficulty === 'easy') {
            // Random valid card
            return validCards[Math.floor(Math.random() * validCards.length)].id;
        }

        if (isLeading) {
            return leadCard(state, validCards, difficulty);
        } else {
            return respondToTrick(state, validCards, playerIndex, difficulty);
        }
    }

    // ---- Specific Strategies ----

    function leadCard(state, validCards, difficulty) {
        // Simple strategy: play highest card, preferably Jack or 9
        // Advanced: play non-trump high cards to draw out opponents' trump, 
        // or lead trump if strong.
        
        let bestCard = validCards[0];
        let maxScore = -1;

        for (const card of validCards) {
            let score = card.strength;
            if (difficulty === 'hard' || difficulty === 'expert') {
                if (card.points > 0) score += card.points * 2;
                
                // If it's a J (strength 8), very high score
                if (card.strength === 8) score += 10;
                
                // If trump is revealed, might want to lead it to draw others out
                if (state.trumpRevealed && card.suit === state.trump) {
                    score += 5;
                }
            }
            if (score > maxScore) {
                maxScore = score;
                bestCard = card;
            }
        }

        return bestCard.id;
    }

    function respondToTrick(state, validCards, playerIndex, difficulty) {
        const trick = state.currentTrick;
        const leadSuit = trick[0].card.suit;
        const partnerIndex = GameEngine.getPartner(playerIndex);
        
        // Find current winning card
        let winningCard = trick[0].card;
        let winnerIndex = trick[0].player;
        let pointsInTrick = 0;

        for (let i = 0; i < trick.length; i++) {
            const card = trick[i].card;
            pointsInTrick += card.points;

            if (state.trump && card.suit === state.trump && winningCard.suit !== state.trump) {
                winnerIndex = trick[i].player;
                winningCard = card;
            } else if (card.suit === winningCard.suit && card.strength > winningCard.strength) {
                if (!(state.trump && winningCard.suit === state.trump && card.suit !== state.trump)) {
                   winnerIndex = trick[i].player;
                   winningCard = card;
                }
            }
        }

        const isPartnerWinning = winnerIndex === partnerIndex;
        const isLastToPlay = trick.length === 3;

        // Sort valid cards by strength
        validCards.sort((a, b) => a.strength - b.strength);

        // Medium logic
        if (difficulty === 'medium') {
            if (isPartnerWinning) {
                // Partner winning: give points (lowest strength with points, or just lowest)
                return validCards[0].id;
            } else {
                // Try to win: play highest
                return validCards[validCards.length - 1].id;
            }
        }

        // Hard/Expert logic
        let bestCard = validCards[0];
        
        if (isPartnerWinning) {
            // Partner is winning
            if (isLastToPlay || (difficulty === 'expert' && winningCard.strength >= 7)) { // Partner has J or 9
                // Safe to throw points
                const pointCards = validCards.filter(c => c.points > 0).sort((a, b) => b.points - a.points);
                if (pointCards.length > 0) {
                    return pointCards[0].id; // Throw highest point card
                }
            }
            // Otherwise, play lowest card
            return validCards[0].id;
        } else {
            // Opponent is winning
            // Can we beat the winning card?
            let canBeat = false;
            let beatingCards = [];
            
            for (const card of validCards) {
                if (state.trump && card.suit === state.trump && winningCard.suit !== state.trump) {
                    beatingCards.push(card);
                    canBeat = true;
                } else if (card.suit === winningCard.suit && card.strength > winningCard.strength) {
                     // Check if winning card is not trump while we are following suit
                    if (!(state.trump && winningCard.suit === state.trump && card.suit !== state.trump)) {
                         beatingCards.push(card);
                         canBeat = true;
                    }
                }
            }

            if (canBeat) {
                beatingCards.sort((a, b) => a.strength - b.strength);
                // Play lowest card that can win
                return beatingCards[0].id;
            } else {
                // Cannot win, play lowest card with least points
                validCards.sort((a, b) => {
                    if (a.points !== b.points) return a.points - b.points;
                    return a.strength - b.strength;
                });
                return validCards[0].id;
            }
        }
    }

    return {
        getBid,
        getTrump,
        getPlayCard
    };
})();
