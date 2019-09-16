import scan, { ElementType, FastScanCallback } from '../src/scan';
import { deepStrictEqual as deepEqual } from 'assert';

type TagRecord = [string, ElementType, number, number];

const getTags = (code: string) => {
    const tags: TagRecord[] = [];
    const cb: FastScanCallback = (name, type, start, end) => tags.push([name, type, start, end]);
    scan(code, cb);
    return tags;
}

describe('Scan', () => {
    it('open tag', () => {
        deepEqual(getTags('<a>'), [['a', ElementType.Open, 0, 3]]);
        deepEqual(getTags('foo<a>'), [['a', ElementType.Open, 3, 6]]);
        deepEqual(getTags('<a>foo'), [['a', ElementType.Open, 0, 3]]);
        deepEqual(getTags('<foo-bar>'), [['foo-bar', ElementType.Open, 0, 9]]);
        deepEqual(getTags('<foo:bar>'), [['foo:bar', ElementType.Open, 0, 9]]);
        deepEqual(getTags('<foo_bar>'), [['foo_bar', ElementType.Open, 0, 9]]);
        deepEqual(getTags('<=>'), []);
        deepEqual(getTags('<1>'), []);

        // Tag with attributes
        deepEqual(getTags('<a href="">'), [['a', ElementType.Open, 0, 11]]);
        deepEqual(getTags('<a foo bar>'), [['a', ElementType.Open, 0, 11]]);
        deepEqual(getTags('<a a={test}>'), [['a', ElementType.Open, 0, 12]]);
        deepEqual(getTags('<a [ng-for]={test}>'), [['a', ElementType.Open, 0, 19]]);
        deepEqual(getTags('<a a=b c {foo}>'), [['a', ElementType.Open, 0, 15]]);
    });

    it('self-closing tag', () => {
        deepEqual(getTags('<a/>foo'), [['a', ElementType.SelfClose, 0, 4]]);
        deepEqual(getTags('<a />foo'), [['a', ElementType.SelfClose, 0, 5]]);
        deepEqual(getTags('<a a=b c {foo}/>'), [['a', ElementType.SelfClose, 0, 16]]);
    });

    it('close tag', () => {
        deepEqual(getTags('foo</a>'), [['a', ElementType.Close, 3, 7]]);
        deepEqual(getTags('</a>foo'), [['a', ElementType.Close, 0, 4]]);
        deepEqual(getTags('</a s>'), []);
        deepEqual(getTags('</a >'), []);
    });
});
