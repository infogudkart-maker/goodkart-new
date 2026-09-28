/**
 * Clear Old Data Utility
 * Clears old product data from localStorage
 * Run this once after category update to clean user browsers
 */

export const clearOldLocalStorageData = () => {
    try {
        // Clear recently viewed products
        const recentlyViewed = localStorage.getItem('recentlyViewed');
        if (recentlyViewed) {
            console.log('🗑️ Clearing recently viewed products...');
            localStorage.removeItem('recentlyViewed');
        }
        
        // Clear any Firestore caches that might have old product data
        const keys = Object.keys(localStorage);
        let clearedCount = 0;
        
        keys.forEach(key => {
            // Clear Firestore cache entries
            if (key.startsWith('fs_cache_')) {
                localStorage.removeItem(key);
                clearedCount++;
            }
        });
        
        if (clearedCount > 0) {
            console.log(`🗑️ Cleared ${clearedCount} cached items`);
        }
        
        console.log('✅ Old data cleared successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error clearing old data:', error);
        return false;
    }
};

// Auto-run once on import (will only run once per session)
const DATA_CLEANUP_VERSION = '2026-03-24'; // Update this date when you need to run cleanup again
const lastCleanup = localStorage.getItem('lastDataCleanup');

if (lastCleanup !== DATA_CLEANUP_VERSION) {
    console.log('🔄 Running one-time data cleanup...');
    clearOldLocalStorageData();
    localStorage.setItem('lastDataCleanup', DATA_CLEANUP_VERSION);
}
