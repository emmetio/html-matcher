import { readFileSync } from 'fs';
import { resolve } from 'path';
import { deepStrictEqual as deepEqual } from 'assert';
import { balancedOutward as outward } from '../src';

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
});
