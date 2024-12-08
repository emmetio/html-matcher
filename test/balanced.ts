import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { describe, it } from 'node:test';
import { deepEqual } from 'node:assert/strict';
import { balancedOutward as outward, balancedInward as inward } from '../src';

const __dirname = dirname(new URL(import.meta.url).pathname)

describe('Balanced models', () => {
    const doc = readFileSync(resolve(__dirname, 'sample.html'), 'utf8');

    it('outward', () => {
        deepEqual(outward(doc, 0), []);

        deepEqual(outward(doc, 1), [
            { name: 'ul', open: [0, 4], close: [179, 184] }
        ]);

        deepEqual(outward(doc, 73), [
            { name: 'li', open: [71, 75], close: [147, 152] },
            { name: 'ul', open: [0, 4], close: [179, 184] }
        ]);

        deepEqual(outward(doc, 114), [
            { name: 'br', open: [112, 118] },
            { name: 'div', open: [78, 83], close: [121, 127] },
            { name: 'li', open: [71, 75], close: [147, 152] },
            { name: 'ul', open: [0, 4], close: [179, 184] }
        ]);
    });

    it('inward', () => {
        deepEqual(inward(doc, 0), [
            { name: 'ul', open: [0, 4], close: [179, 184] },
            { name: 'li', open: [6, 10], close: [25, 30] },
            { name: 'a', open: [10, 21], close: [21, 25] }
        ]);

        deepEqual(inward(doc, 1), [
            { name: 'ul', open: [0, 4], close: [179, 184] },
            { name: 'li', open: [6, 10], close: [25, 30] },
            { name: 'a', open: [10, 21], close: [21, 25] }
        ]);

        deepEqual(inward(doc, 73), [
            { name: 'li', open: [71, 75], close: [147, 152] },
            { name: 'div', open: [78, 83], close: [121, 127] },
            { name: 'img', open: [87, 108] }
        ]);

        deepEqual(inward(doc, 114), [
            { name: 'br', open: [112, 118] }
        ]);
    });
});
