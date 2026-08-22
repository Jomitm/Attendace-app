/**
 * Task Classification Learning Module
 *
 * Uses predictable document IDs (userId + patternKey) to avoid pre-query reads.
 * Uses FieldValue.increment() to bump count server-side without reading first.
 * Cost per record: 1 write, 0 reads.
 *
 * Flow:
 *   1. User saves a task with classification -> recordClassification()
 *   2. User opens editor for new task -> suggestClassification(taskText)
 *   3. System matches keywords against historical patterns -> returns best guess
 */

import { AppDB } from './db.js';
import { AppAuth } from './auth.js';

const COLLECTION = 'classification_patterns';
const MAX_PATTERNS_PER_USER = 200;
const SUGGESTION_MIN_CONFIDENCE = 2;

function normalizeText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractKeywords(text) {
    const normalized = normalizeText(text);
    if (!normalized) return [];
    const words = normalized.split(' ').filter(w => w.length >= 3);
    const stopwords = new Set([
        'the', 'and', 'for', 'with', 'from', 'that', 'this', 'will', 'have',
        'been', 'were', 'they', 'their', 'what', 'when', 'where', 'which',
        'who', 'how', 'not', 'but', 'can', 'may', 'our', 'are', 'was',
        'has', 'had', 'did', 'get', 'got', 'let', 'all', 'any', 'own',
        'also', 'just', 'than', 'then', 'into', 'over', 'such', 'make',
        'like', 'each', 'very', 'much', 'more', 'some', 'time', 'about',
        'after', 'before', 'being', 'does', 'doing', 'done', 'only',
        'other', 'should', 'could', 'would', 'there', 'these', 'those'
    ]);
    return [...new Set(words.filter(w => !stopwords.has(w)))];
}

function computeSimilarity(keywordsA, keywordsB) {
    if (!keywordsA.length || !keywordsB.length) return 0;
    const setB = new Set(keywordsB);
    let matches = 0;
    for (const kw of keywordsA) {
        if (setB.has(kw)) matches++;
    }
    return matches;
}

function makePatternKey(taskText) {
    const keywords = extractKeywords(taskText).sort().slice(0, 6);
    return keywords.join('_');
}

function getFieldValue() {
    if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
        return firebase.firestore.FieldValue;
    }
    return null;
}

let patternsCache = null;
let patternsCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadPatterns(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && patternsCache && (now - patternsCacheTime) < CACHE_TTL_MS) {
        return patternsCache;
    }

    const currentUser = AppAuth.getUser();
    if (!currentUser?.id) return [];

    try {
        const db = AppDB.db;
        if (!db) return patternsCache || [];

        const snapshot = await db.collection(COLLECTION)
            .where('userId', '==', currentUser.id)
            .orderBy('updatedAt', 'desc')
            .limit(MAX_PATTERNS_PER_USER)
            .get();

        const results = [];
        snapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() });
        });

        patternsCache = results;
        patternsCacheTime = now;
        return results;
    } catch (err) {
        console.warn('Classification learning: failed to load patterns', err);
        return patternsCache || [];
    }
}

/**
 * Record a task classification when user saves a task.
 * Predictable doc ID = userId_patternKey. No pre-query needed.
 * Cost: 1 write, 0 reads.
 */
export async function recordClassification(taskText, { sizeCategory, purposeCategory, priorityLevel }) {
    const currentUser = AppAuth.getUser();
    if (!currentUser?.id) return;
    const trimmedText = String(taskText || '').trim();
    if (!trimmedText) return;

    const hasAny = sizeCategory || purposeCategory || priorityLevel;
    if (!hasAny) return;

    try {
        const db = AppDB.db;
        if (!db) return;

        const FV = getFieldValue();
        const patternKey = makePatternKey(trimmedText);
        const docId = `${currentUser.id}_${patternKey}`;

        const updateData = {
            userId: currentUser.id,
            patternKey,
            sampleTask: trimmedText.slice(0, 200),
            updatedAt: FV ? FV.serverTimestamp() : new Date().toISOString()
        };
        if (sizeCategory) updateData.sizeCategory = sizeCategory;
        if (purposeCategory) updateData.purposeCategory = purposeCategory;
        if (priorityLevel) updateData.priorityLevel = priorityLevel;
        updateData.count = FV ? FV.increment(1) : 1;

        await db.collection(COLLECTION).doc(docId).set(updateData, { merge: true });

        patternsCacheTime = 0;
    } catch (err) {
        console.warn('Classification learning: failed to record pattern', err);
    }
}

/**
 * Suggest a classification for a task based on historical patterns.
 * Returns { sizeCategory, purposeCategory, priorityLevel, confidence } or null.
 */
export async function suggestClassification(taskText) {
    const trimmedText = String(taskText || '').trim();
    if (!trimmedText || trimmedText.length < 5) return null;

    const patterns = await loadPatterns();
    if (!patterns.length) return null;

    const taskKeywords = extractKeywords(trimmedText);
    if (!taskKeywords.length) return null;

    let bestMatch = null;
    let bestScore = 0;

    for (const pattern of patterns) {
        const patternKeywords = extractKeywords(pattern.sampleTask || '');
        const score = computeSimilarity(taskKeywords, patternKeywords);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = pattern;
        }
    }

    if (!bestMatch || bestScore < SUGGESTION_MIN_CONFIDENCE) return null;

    const totalKeywords = taskKeywords.length;
    const confidence = Math.min(100, Math.round((bestScore / totalKeywords) * 100));

    return {
        sizeCategory: bestMatch.sizeCategory || null,
        purposeCategory: bestMatch.purposeCategory || null,
        priorityLevel: bestMatch.priorityLevel || null,
        confidence,
        matchCount: bestMatch.count || 1,
        sampleTask: bestMatch.sampleTask || ''
    };
}

/**
 * Clear the in-memory cache (e.g. on logout).
 */
export function clearLearningCache() {
    patternsCache = null;
    patternsCacheTime = 0;
}

export default { recordClassification, suggestClassification, clearLearningCache };
