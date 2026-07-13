/**
 * ২৯ কার্ড গেম — Animations Helper
 * Provides promises-based animation helpers for game UI.
 */
const Animations = (() => {

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    /**
     * Animate dealing a card from deck to a player's seat
     * @param {HTMLElement} cardEl 
     * @param {string} position 'bottom', 'top', 'left', 'right'
     */
    async function dealCard(cardEl, position) {
        cardEl.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        let tx = 0, ty = 0, rot = 0;
        
        switch (position) {
            case 'bottom': ty = 250; rot = 0; break;
            case 'top': ty = -250; rot = 180; break;
            case 'left': tx = -150; rot = -90; break;
            case 'right': tx = 150; rot = 90; break;
        }

        // Initially at center (deck)
        cardEl.style.transform = `translate(0, 0) scale(0.5) rotate(0deg)`;
        cardEl.style.opacity = '0';
        
        await delay(50);
        
        cardEl.style.opacity = '1';
        cardEl.style.transform = `translate(${tx}px, ${ty}px) scale(0.8) rotate(${rot}deg)`;
        
        await delay(400);
    }

    /**
     * Animate playing a card from hand to center table
     */
    async function playCardToTrick(cardEl, position) {
        cardEl.style.transition = 'all 0.3s ease-out';
        
        let tx = 0, ty = 0, rot = 0;
        // Adjust final resting position slightly based on who played it
        switch (position) {
            case 'bottom': ty = 20; rot = Math.random() * 10 - 5; break;
            case 'top': ty = -20; rot = 180 + Math.random() * 10 - 5; break;
            case 'left': tx = -20; rot = -90 + Math.random() * 10 - 5; break;
            case 'right': tx = 20; rot = 90 + Math.random() * 10 - 5; break;
        }

        cardEl.style.transform = `translate(${tx}px, ${ty}px) scale(1) rotate(${rot}deg)`;
        
        await delay(300);
    }

    /**
     * Animate trick collection to the winning player
     */
    async function collectTrick(trickContainer, winnerPosition) {
        trickContainer.style.transition = 'all 0.5s ease-in';
        
        let tx = 0, ty = 0;
        switch (winnerPosition) {
            case 'bottom': ty = 300; break;
            case 'top': ty = -300; break;
            case 'left': tx = -200; break;
            case 'right': tx = 200; break;
        }

        trickContainer.style.transform = `translate(${tx}px, ${ty}px) scale(0.3) rotate(180deg)`;
        trickContainer.style.opacity = '0';
        
        await delay(500);
    }

    /**
     * Show flying score text
     */
    async function showFloatingScore(container, text, color) {
        const el = document.createElement('div');
        el.innerText = text;
        el.style.position = 'absolute';
        el.style.left = '50%';
        el.style.top = '50%';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.color = color;
        el.style.fontWeight = 'bold';
        el.style.fontSize = '24px';
        el.style.textShadow = '0 2px 4px rgba(0,0,0,0.8)';
        el.style.zIndex = '100';
        el.style.transition = 'all 1s ease-out';
        
        container.appendChild(el);
        
        await delay(50);
        
        el.style.transform = 'translate(-50%, -150px) scale(1.5)';
        el.style.opacity = '0';
        
        await delay(1000);
        el.remove();
    }

    async function showChatBubble(position, text) {
        const tableFelt = document.querySelector('.table-felt');
        if (!tableFelt) return;

        // Find the player seat based on position (e.g. 'bottom', 'top')
        const seat = document.querySelector(`.player-seat.${position}`);
        if (!seat) return;

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.innerText = text;

        // Position it near the seat
        if (position === 'bottom') {
            bubble.style.bottom = '80px';
            bubble.style.left = '50%';
            bubble.style.transform = 'translateX(-50%)';
        } else if (position === 'top') {
            bubble.style.top = '80px';
            bubble.style.left = '50%';
            bubble.style.transform = 'translateX(-50%)';
        } else if (position === 'left') {
            bubble.style.left = '80px';
            bubble.style.top = '50%';
            bubble.style.transform = 'translateY(-50%)';
        } else if (position === 'right') {
            bubble.style.right = '80px';
            bubble.style.top = '50%';
            bubble.style.transform = 'translateY(-50%)';
        }

        tableFelt.appendChild(bubble);

        // Animate in
        await delay(10);
        bubble.style.opacity = '1';
        bubble.style.transform = bubble.style.transform + ' scale(1.1)';

        await delay(150);
        bubble.style.transform = bubble.style.transform.replace(' scale(1.1)', '');

        // Remove after 3 seconds
        await delay(3000);
        bubble.style.opacity = '0';
        await delay(300);
        bubble.remove();
    }

    return {
        delay,
        dealCard,
        playCardToTrick,
        collectTrick,
        showFloatingScore,
        showChatBubble
    };
})();
