import { deepStrictEqual as deepEqual } from 'assert';
import { attributes } from '../src';

describe('Attributes', () => {
    it('parse attributes string', () => {
        deepEqual(attributes('foo bar="baz" *ngIf={a == b} a=b '), [
            {
                name: 'foo',
                nameStart: 0,
                nameEnd: 3
            },
            {
                name: 'bar',
                value: '"baz"',
                nameStart: 4,
                nameEnd: 7,
                valueStart: 8,
                valueEnd: 13
            },
            {
                name: '*ngIf',
                value: '{a == b}',
                nameStart: 14,
                nameEnd: 19,
                valueStart: 20,
                valueEnd: 28
            },
            {
                name: 'a',
                value: 'b',
                nameStart: 29,
                nameEnd: 30,
                valueStart: 31,
                valueEnd: 32
            }
        ]);
    });
});
