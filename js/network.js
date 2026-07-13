/**
 * ২৯ কার্ড গেম — Network & Firebase Integration
 * Handles REST API communication with Firebase RTDB.
 */
const Network = (() => {

    const DB_URL = 'https://card-ae1f3-default-rtdb.firebaseio.com';
    let userId = null;

    // ---- Initialize ----

    function init(uid) {
        userId = uid;
    }

    // ---- Cloud Sync ----

    /**
     * Save/Update user profile and stats to Firebase
     */
    async function syncUserData(data) {
        if (!userId) return false;
        
        try {
            const response = await fetch(`${DB_URL}/users/${userId}.json`, {
                method: 'PATCH', // Update only provided fields
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Firebase sync failed');
            return true;
        } catch (error) {
            console.error('Network Error:', error);
            return false;
        }
    }

    /**
     * Fetch user data from Firebase
     */
    async function fetchUserData() {
        if (!userId) return null;
        
        try {
            const response = await fetch(`${DB_URL}/users/${userId}.json`);
            if (!response.ok) throw new Error('Firebase fetch failed');
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Network Fetch Error:', error);
            return null;
        }
    }
    
    // ---- Multiplayer Rooms (REST API Fallback) ----
    
    async function createRoom(roomConfig) {
        if (!userId) return null;
        
        // Generate random 6 character code
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const roomData = {
            id: roomId,
            host: userId,
            status: 'waiting',
            config: roomConfig,
            players: {
                bottom: userId,
                // Others will join here, or filled with bots
            },
            timestamp: Date.now()
        };
        
        try {
            const response = await fetch(`${DB_URL}/rooms/${roomId}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
            
            if (response.ok) return roomId;
            return null;
        } catch (error) {
            console.error('Room Creation Error:', error);
            return null;
        }
    }

    async function joinRoom(roomId) {
        if (!userId) return { success: false, error: 'Not initialized' };
        
        try {
            // Check if room exists
            const res = await fetch(`${DB_URL}/rooms/${roomId}.json`);
            const roomData = await res.json();
            
            if (!roomData) return { success: false, error: 'Room not found' };
            if (roomData.status !== 'waiting') return { success: false, error: 'Room is already playing' };
            
            // Find empty seat
            const seats = ['right', 'top', 'left'];
            let emptySeat = null;
            
            for (const seat of seats) {
                if (!roomData.players[seat]) {
                    emptySeat = seat;
                    break;
                }
            }
            
            if (!emptySeat) return { success: false, error: 'Room is full' };
            
            // Join seat
            const joinRes = await fetch(`${DB_URL}/rooms/${roomId}/players.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [emptySeat]: userId })
            });
            
            if (joinRes.ok) return { success: true, room: roomData, seat: emptySeat };
            return { success: false, error: 'Failed to join' };
            
        } catch (error) {
            console.error('Join Room Error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    return {
        init,
        syncUserData,
        fetchUserData,
        createRoom,
        joinRoom
    };
})();
