/**
 * ২৯ কার্ড গেম — Storage Module
 * Handles localStorage persistence for profile, stats, settings, and match history.
 */
const Storage = (() => {
    const KEYS = {
        PROFILE: '29card_profile',
        STATS: '29card_stats',
        SETTINGS: '29card_settings',
        HISTORY: '29card_history',
        ACHIEVEMENTS: '29card_achievements',
    };

    const DEFAULT_PROFILE = {
        name: 'তারেক',
        nameEn: 'Tarek',
        avatarEmoji: '👤',
        level: 1,
        xp: 0,
        xpToNext: 500,
        coins: 1000,
        rank: 'ব্রোঞ্জ I',
        rankEn: 'Bronze I',
        rankPoints: 0,
        id: '#' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    };

    const DEFAULT_STATS = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        highestBid: 0,
        totalTricks: 0,
        perfectGames: 0, // won with all 8 tricks
        currentStreak: 0,
        bestStreak: 0,
    };

    const DEFAULT_SETTINGS = {
        language: 'bn', // 'bn' or 'en'
        sound: true,
        music: true,
        vibration: true,
        graphicsQuality: 'high', // 'low', 'medium', 'high'
        notifications: true,
    };

    const DEFAULT_ACHIEVEMENTS = [
        { id: 'first_win', icon: '🥇', name: 'প্রথম জয়', nameEn: 'First Win', desc: 'প্রথম গেম জিতুন', unlocked: false },
        { id: 'sharpshooter', icon: '🎯', name: 'শার্পশুটার', nameEn: 'Sharpshooter', desc: '১০টি গেম জিতুন', unlocked: false },
        { id: 'on_fire', icon: '🔥', name: 'অন ফায়ার', nameEn: 'On Fire', desc: '৫ গেম পরপর জিতুন', unlocked: false },
        { id: 'diamond', icon: '💎', name: 'ডায়মন্ড', nameEn: 'Diamond', desc: '৫০টি গেম জিতুন', unlocked: false },
        { id: 'lightning', icon: '⚡', name: 'লাইটনিং', nameEn: 'Lightning', desc: '২৯ পয়েন্ট পান', unlocked: false },
        { id: 'star', icon: '🌟', name: 'স্টার', nameEn: 'Star', desc: '১০০টি গেম খেলুন', unlocked: false },
        { id: 'king', icon: '👑', name: 'রাজা', nameEn: 'King', desc: 'সব অর্জন আনলক করুন', unlocked: false },
    ];

    // ---- Core CRUD ----

    function _get(key, defaultVal) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : { ...defaultVal };
        } catch {
            return { ...defaultVal };
        }
    }

    function _set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Storage save failed:', e);
        }
    }

    // ---- Profile ----

    function getProfile() {
        return _get(KEYS.PROFILE, DEFAULT_PROFILE);
    }

    function saveProfile(profile) {
        _set(KEYS.PROFILE, profile);
        syncToCloud();
    }

    function updateProfile(updates) {
        const profile = getProfile();
        Object.assign(profile, updates);
        saveProfile(profile);
        return profile;
    }

    function addCoins(amount) {
        const profile = getProfile();
        profile.coins = Math.max(0, profile.coins + amount);
        saveProfile(profile);
        return profile.coins;
    }

    function addXP(amount) {
        const profile = getProfile();
        profile.xp += amount;

        // Level up check
        while (profile.xp >= profile.xpToNext) {
            profile.xp -= profile.xpToNext;
            profile.level++;
            profile.xpToNext = Math.floor(profile.xpToNext * 1.3);
        }

        // Rank update
        const ranks = [
            { min: 0, name: 'ব্রোঞ্জ I', en: 'Bronze I' },
            { min: 5, name: 'ব্রোঞ্জ II', en: 'Bronze II' },
            { min: 10, name: 'সিলভার I', en: 'Silver I' },
            { min: 15, name: 'সিলভার II', en: 'Silver II' },
            { min: 20, name: 'গোল্ড I', en: 'Gold I' },
            { min: 25, name: 'গোল্ড II', en: 'Gold II' },
            { min: 30, name: 'প্লাটিনাম', en: 'Platinum' },
            { min: 40, name: 'ডায়মন্ড', en: 'Diamond' },
            { min: 50, name: 'মাস্টার', en: 'Master' },
        ];

        const applicable = ranks.filter(r => profile.level >= r.min);
        const currentRank = applicable[applicable.length - 1];
        profile.rank = currentRank.name;
        profile.rankEn = currentRank.en;

        saveProfile(profile);
        return profile;
    }

    // ---- Stats ----

    function getStats() {
        return _get(KEYS.STATS, DEFAULT_STATS);
    }

    function recordGameResult(won, score, opponentScore, bid) {
        const stats = getStats();
        stats.totalGames++;
        if (won) {
            stats.wins++;
            stats.currentStreak++;
            stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
            if (score >= 29) stats.perfectGames++;
        } else {
            stats.losses++;
            stats.currentStreak = 0;
        }
        stats.winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
        stats.highestBid = Math.max(stats.highestBid, bid || 0);
        _set(KEYS.STATS, stats);

        // Check achievements
        checkAchievements(stats);
        syncToCloud();

        return stats;
    }

    // ---- Match History ----

    function getHistory() {
        try {
            const data = localStorage.getItem(KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function addToHistory(entry) {
        const history = getHistory();
        history.unshift({
            ...entry,
            timestamp: Date.now(),
        });
        // Keep last 20
        if (history.length > 20) history.length = 20;
        _set(KEYS.HISTORY, history);
        syncToCloud();
        return history;
    }

    // ---- Settings ----

    function getSettings() {
        return _get(KEYS.SETTINGS, DEFAULT_SETTINGS);
    }

    function saveSettings(settings) {
        _set(KEYS.SETTINGS, settings);
        syncToCloud();
    }

    function updateSetting(key, value) {
        const settings = getSettings();
        settings[key] = value;
        saveSettings(settings);
        return settings;
    }

    // ---- Achievements ----

    function getAchievements() {
        const stored = _get(KEYS.ACHIEVEMENTS, null);
        if (!stored || !Array.isArray(stored.achievements || stored)) {
            return [...DEFAULT_ACHIEVEMENTS];
        }
        return Array.isArray(stored) ? stored : stored.achievements || [...DEFAULT_ACHIEVEMENTS];
    }

    function saveAchievements(achievements) {
        _set(KEYS.ACHIEVEMENTS, achievements);
        syncToCloud();
    }

    function checkAchievements(stats) {
        const achievements = getAchievements();
        let changed = false;

        const checks = {
            'first_win': () => stats.wins >= 1,
            'sharpshooter': () => stats.wins >= 10,
            'on_fire': () => stats.bestStreak >= 5,
            'diamond': () => stats.wins >= 50,
            'lightning': () => stats.perfectGames >= 1,
            'star': () => stats.totalGames >= 100,
        };

        achievements.forEach(a => {
            if (!a.unlocked && checks[a.id] && checks[a.id]()) {
                a.unlocked = true;
                changed = true;
            }
        });

        // King: all others unlocked
        const king = achievements.find(a => a.id === 'king');
        if (king && !king.unlocked) {
            const others = achievements.filter(a => a.id !== 'king');
            if (others.every(a => a.unlocked)) {
                king.unlocked = true;
                changed = true;
            }
        }

        if (changed) saveAchievements(achievements);
        return achievements;
    }

    // ---- Initialize & Cloud Sync ----

    async function init() {
        // Ensure all stores have defaults
        if (!localStorage.getItem(KEYS.PROFILE)) saveProfile(DEFAULT_PROFILE);
        if (!localStorage.getItem(KEYS.STATS)) _set(KEYS.STATS, DEFAULT_STATS);
        if (!localStorage.getItem(KEYS.SETTINGS)) saveSettings(DEFAULT_SETTINGS);
        if (!localStorage.getItem(KEYS.ACHIEVEMENTS)) saveAchievements(DEFAULT_ACHIEVEMENTS);
        
        // Initialize Firebase Network with User ID
        const profile = getProfile();
        let uid = localStorage.getItem('29card_uid');
        if (!uid) {
            // Generate a persistent anonymous UID for this device
            uid = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('29card_uid', uid);
        }
        
        if (typeof Network !== 'undefined') {
            Network.init(uid);
            
            // Try to fetch existing data from cloud
            const cloudData = await Network.fetchUserData();
            if (cloudData) {
                if (cloudData.profile) saveProfile({...getProfile(), ...cloudData.profile});
                if (cloudData.stats) _set(KEYS.STATS, {...getStats(), ...cloudData.stats});
                if (cloudData.history) _set(KEYS.HISTORY, cloudData.history);
                if (cloudData.achievements) saveAchievements(cloudData.achievements);
            } else {
                // First time connecting, push local default data to cloud
                syncToCloud();
            }
        }
    }
    
    function syncToCloud() {
        if (typeof Network !== 'undefined') {
            Network.syncUserData({
                profile: getProfile(),
                stats: getStats(),
                history: getHistory(),
                achievements: getAchievements()
            });
        }
    }

    return {
        init, syncToCloud,
        getProfile, saveProfile, updateProfile, addCoins, addXP,
        getStats, recordGameResult,
        getHistory, addToHistory,
        getSettings, saveSettings, updateSetting,
        getAchievements, checkAchievements,
    };
})();
