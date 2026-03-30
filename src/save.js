// ============================================================
// save.js — Save/Load system using localStorage
// Persists: completed stages, coin totals, best times, lives
// ============================================================

const SaveSystem = {
    SAVE_KEY: 'kingdoms_of_the_canvas_save',

    // Default empty save data
    _defaultData() {
        return {
            completedStages: [],     // Array of stage IDs like '1-1', '1-2'
            coinRecords: {},         // { '1-1': 12, '1-2': 8 }
            bestTimes: {},           // { '1-1': 45.2, '1-2': 60.1 } (seconds)
            lives: PLAYER_START_LIVES,
            currentNode: 0           // Index of last selected node
        };
    },

    /**
     * Check if save data exists in localStorage.
     */
    hasSaveData() {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            return raw !== null && raw !== undefined;
        } catch (e) {
            return false;
        }
    },

    /**
     * Load save data from localStorage.
     * Returns default data if nothing saved.
     */
    load() {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                // Merge with defaults to handle missing fields from older saves
                const defaults = this._defaultData();
                return {
                    completedStages: data.completedStages || defaults.completedStages,
                    coinRecords: data.coinRecords || defaults.coinRecords,
                    bestTimes: data.bestTimes || defaults.bestTimes,
                    lives: data.lives !== undefined ? data.lives : defaults.lives,
                    currentNode: data.currentNode !== undefined ? data.currentNode : defaults.currentNode
                };
            }
        } catch (e) {
            console.warn('SaveSystem: Failed to load save data', e);
        }
        return this._defaultData();
    },

    /**
     * Save data to localStorage.
     */
    save(data) {
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('SaveSystem: Failed to save data', e);
        }
    },

    /**
     * Record a stage completion. Updates best time and coin record
     * only if the new values are improvements.
     */
    recordStageCompletion(stageId, time, coins) {
        const data = this.load();

        // Mark stage as completed
        if (!data.completedStages.includes(stageId)) {
            data.completedStages.push(stageId);
        }

        // Update best time (lower is better)
        if (!data.bestTimes[stageId] || time < data.bestTimes[stageId]) {
            data.bestTimes[stageId] = time;
        }

        // Update coin record (higher is better)
        if (!data.coinRecords[stageId] || coins > data.coinRecords[stageId]) {
            data.coinRecords[stageId] = coins;
        }

        // Save lives
        data.lives = Player.lives;

        this.save(data);
        return data;
    },

    /**
     * Clear all save data (New Game).
     */
    clearSave() {
        try {
            localStorage.removeItem(this.SAVE_KEY);
        } catch (e) {
            console.warn('SaveSystem: Failed to clear save data', e);
        }
    },

    /**
     * Check if a specific stage is completed.
     */
    isStageCompleted(stageId) {
        const data = this.load();
        return data.completedStages.includes(stageId);
    },

    /**
     * Get best time for a stage (or null if unplayed).
     */
    getBestTime(stageId) {
        const data = this.load();
        return data.bestTimes[stageId] || null;
    },

    /**
     * Get coin record for a stage (or null if unplayed).
     */
    getCoinRecord(stageId) {
        const data = this.load();
        return data.coinRecords[stageId] !== undefined ? data.coinRecords[stageId] : null;
    }
};
