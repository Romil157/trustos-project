window.TrustOS = window.TrustOS || {};

TrustOS.BloomFilter = {
    // A lightweight Bloom filter using two hash functions (FNV-1a and djb2 variant)
    size: 50000,
    bitArray: new Uint8Array(50000),

    _hash1: function (str) {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return Math.abs(hash) % this.size;
    },

    _hash2: function (str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = (Math.imul(hash, 33) ^ str.charCodeAt(i));
        }
        return Math.abs(hash) % this.size;
    },

    add: function (item) {
        this.bitArray[this._hash1(item)] = 1;
        this.bitArray[this._hash2(item)] = 1;
    },

    test: function (item) {
        return this.bitArray[this._hash1(item)] === 1 && this.bitArray[this._hash2(item)] === 1;
    }
};
