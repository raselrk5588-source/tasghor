/**
 * ২৯ কার্ড গেম — UI Renderer
 * Handles data population for non-gameplay screens.
 */
const UIRenderer = (() => {

    function renderScreen(screenId) {
        switch (screenId) {
            case 'home': renderHome(); break;
            case 'profile': renderProfile(); break;
            case 'result': renderResult(); break;
            case 'settings': renderSettings(); break;
            // Add other screens if needed
        }
    }

    function renderHome() {
        const profile = Storage.getProfile();
        
        // Update top bar
        const nameEl = document.querySelector('#home .player-name');
        if (nameEl) nameEl.innerText = profile.name;
        
        const levelEl = document.querySelector('#home .player-level');
        if (levelEl) {
            const phone = localStorage.getItem('phone') || profile.id; // fallback to ID if no phone
            levelEl.innerText = phone;
        }
        
        const avatarEl = document.querySelector('#home .avatar');
        if (avatarEl) avatarEl.innerHTML = `${profile.avatarEmoji}<div class="level-badge">${profile.level}</div>`;
        
        const coinsEl = document.querySelector('#home .coins span:nth-child(2)');
        if (coinsEl) coinsEl.innerText = profile.coins.toLocaleString();
    }

    function renderProfile() {
        const profile = Storage.getProfile();
        const stats = Storage.getStats();
        
        // Header
        const nameEl = document.querySelector('#profile .profile-name');
        if (nameEl) nameEl.innerText = profile.name;
        
        const idEl = document.querySelector('#profile .profile-id');
        if (idEl) idEl.innerText = `ID: ${profile.id}`;
        
        const avatarEl = document.querySelector('#profile .profile-avatar');
        if (avatarEl) avatarEl.innerHTML = `${profile.avatarEmoji}<div class="profile-level">Lv.${profile.level}</div>`;
        
        // XP Bar
        const xpFill = document.querySelector('#profile .xp-fill');
        const xpLabel = document.querySelector('#profile .xp-label');
        if (xpFill && xpLabel) {
            const pct = Math.min(100, (profile.xp / profile.xpToNext) * 100);
            xpFill.style.width = `${pct}%`;
            xpLabel.innerText = `${profile.xp} / ${profile.xpToNext} XP`;
        }
        
        // Stats
        const statValues = document.querySelectorAll('#profile .stat-value');
        if (statValues.length >= 3) {
            statValues[0].innerText = `${stats.winRate}%`; // Win rate
            statValues[1].innerText = stats.totalGames; // Matches played
            statValues[2].innerText = profile.coins.toLocaleString(); // Coins
        }
        
        // Match history
        const historyContainer = document.querySelector('#profile .match-history');
        if (historyContainer) {
            const history = Storage.getHistory();
            
            // Keep the section title
            const titleHtml = '<div class="section-title">🕒 সাম্প্রতিক ম্যাচ</div>';
            
            if (history.length === 0) {
                historyContainer.innerHTML = titleHtml + '<div style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 13px;">কোন ম্যাচ খেলা হয়নি</div>';
            } else {
                let html = titleHtml;
                history.forEach(match => {
                    const isWin = match.won;
                    
                    // Format Date (আজ, গতকাল, or date)
                    const dateObj = new Date(match.timestamp);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    
                    let dateStr = '';
                    if (dateObj.toDateString() === today.toDateString()) {
                        dateStr = 'আজ, ' + dateObj.toLocaleTimeString('bn-BD', {hour: 'numeric', minute:'2-digit', hour12: true});
                    } else if (dateObj.toDateString() === yesterday.toDateString()) {
                        dateStr = 'গতকাল, ' + dateObj.toLocaleTimeString('bn-BD', {hour: 'numeric', minute:'2-digit', hour12: true});
                    } else {
                        dateStr = dateObj.toLocaleDateString('bn-BD') + ', ' + dateObj.toLocaleTimeString('bn-BD', {hour: 'numeric', minute:'2-digit', hour12: true});
                    }
                    
                    let modeName = 'বট ম্যাচ';
                    if (match.mode === 'lan') modeName = 'ল্যান ম্যাচ';
                    else if (match.mode === 'online') modeName = 'র‍্যাঙ্কড ম্যাচ';
                    
                    html += `
                    <div class="history-item">
                        <div class="hi-result ${isWin ? 'win' : 'loss'}">${isWin ? 'W' : 'L'}</div>
                        <div class="hi-info">
                            <div class="hi-mode">${modeName}</div>
                            <div class="hi-date">${dateStr}</div>
                        </div>
                        <div class="hi-score">${match.score} - ${match.oppScore}</div>
                    </div>`;
                });
                historyContainer.innerHTML = html;
            }
        }
    }

    function renderResult(resultData) {
        if (!resultData) return;
        
        const titleEl = document.querySelector('#result .result-title');
        const scoreEl = document.querySelector('#result .result-score');
        const rewardValues = document.querySelectorAll('#result .reward-value');
        
        if (resultData.won) {
            if (titleEl) {
                titleEl.innerText = 'বিজয়ী!';
                titleEl.style.background = 'var(--gold-text-gradient)';
                titleEl.style.webkitTextFillColor = 'transparent';
                titleEl.style.webkitBackgroundClip = 'text';
            }
            if (rewardValues.length >= 2) {
                rewardValues[0].innerText = `+${resultData.coins}`;
                rewardValues[1].innerText = `+${resultData.xp} XP`;
            }
        } else {
            if (titleEl) {
                titleEl.innerText = 'পরাজিত';
                titleEl.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                titleEl.style.webkitTextFillColor = 'transparent';
                titleEl.style.webkitBackgroundClip = 'text';
            }
            if (rewardValues.length >= 2) {
                rewardValues[0].innerText = `+${resultData.coins}`; // Consolation
                rewardValues[1].innerText = `+${resultData.xp} XP`;
            }
        }
        
        if (scoreEl) {
            scoreEl.innerText = `স্কোর: ${resultData.score} - ${resultData.oppScore}`;
        }
    }

    function renderSettings() {
        const settings = Storage.getSettings();
        
        // Find toggles (assuming order: Sound, Music, Vibration)
        const toggles = document.querySelectorAll('#settings .toggle');
        if (toggles.length >= 3) {
            if (settings.sound) toggles[0].classList.add('on'); else toggles[0].classList.remove('on');
            if (settings.music) toggles[1].classList.add('on'); else toggles[1].classList.remove('on');
            if (settings.vibration) toggles[2].classList.add('on'); else toggles[2].classList.remove('on');
            
            // Add click listeners if not added yet
            if (!toggles[0].hasAttribute('data-init')) {
                toggles[0].setAttribute('data-init', 'true');
                toggles[0].onclick = function() {
                    this.classList.toggle('on');
                    Storage.updateSetting('sound', this.classList.contains('on'));
                };
                toggles[1].onclick = function() {
                    this.classList.toggle('on');
                    Storage.updateSetting('music', this.classList.contains('on'));
                };
                toggles[2].onclick = function() {
                    this.classList.toggle('on');
                    Storage.updateSetting('vibration', this.classList.contains('on'));
                };
            }
        }
    }

    return {
        renderScreen,
        renderResult
    };
})();
