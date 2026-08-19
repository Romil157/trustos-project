window.TrustOS = window.TrustOS || {};

/**
 * TrustOS Bit-Packed O(1) Bloom Filter
 * Uses 3 independent hash functions across a compact Uint32Array bitset.
 */
TrustOS.BloomFilter = {
    // 64,000 bits stored in 2,000 32-bit words (takes ~8KB memory)
    numBits: 64000,
    words: null,

    init: function (sizeInBits) {
        if (sizeInBits) {
            this.numBits = sizeInBits;
        }
        const numWords = Math.ceil(this.numBits / 32);
        this.words = new Uint32Array(numWords);
    },

    // Hash Function 1: FNV-1a 32-bit
    _hashFNV: function (str) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
        }
        return (hash >>> 0) % this.numBits;
    },

    // Hash Function 2: DJB2 variant
    _hashDJB2: function (str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return (Math.abs(hash) >>> 0) % this.numBits;
    },

    // Hash Function 3: SDBM hash
    _hashSDBM: function (str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
            hash |= 0;
        }
        return (Math.abs(hash) >>> 0) % this.numBits;
    },

    _setBit: function (bitIndex) {
        const wordIndex = Math.floor(bitIndex / 32);
        const bitOffset = bitIndex % 32;
        this.words[wordIndex] |= (1 << bitOffset);
    },

    _getBit: function (bitIndex) {
        const wordIndex = Math.floor(bitIndex / 32);
        const bitOffset = bitIndex % 32;
        return (this.words[wordIndex] & (1 << bitOffset)) !== 0;
    },

    add: function (item) {
        if (!this.words) this.init();
        if (!item || typeof item !== 'string') return;
        const normalized = item.trim().toLowerCase();
        this._setBit(this._hashFNV(normalized));
        this._setBit(this._hashDJB2(normalized));
        this._setBit(this._hashSDBM(normalized));
    },

    test: function (item) {
        if (!this.words) this.init();
        if (!item || typeof item !== 'string') return false;
        const normalized = item.trim().toLowerCase();
        return this._getBit(this._hashFNV(normalized)) &&
               this._getBit(this._hashDJB2(normalized)) &&
               this._getBit(this._hashSDBM(normalized));
    },

    clear: function () {
        if (this.words) {
            this.words.fill(0);
        }
    }
};

// Auto-initialize Bloom Filter
TrustOS.BloomFilter.init();
