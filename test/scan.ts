import { scan, ElementType, FastScanCallback, ScannerOptions, createOptions } from '../src';
import { deepStrictEqual as deepEqual } from 'assert';

type TagRecord = [string, ElementType, number, number];

const getTags = (code: string, opt: Partial<ScannerOptions> = {}) => {
    const tags: TagRecord[] = [];
    const cb: FastScanCallback = (name, type, start, end) => tags.push([name, type, start, end]);
    scan(code, cb, createOptions(opt));
    return tags;
};

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

    it('special tags', () => {
        deepEqual(getTags('<a>foo</a><style><b></style><c>bar</c>'), [
            ['a', ElementType.Open, 0, 3],
            ['a', ElementType.Close, 6, 10],
            ['style', ElementType.Open, 10, 17],
            ['style', ElementType.Close, 20, 28],
            ['c', ElementType.Open, 28, 31],
            ['c', ElementType.Close, 34, 38]
        ]);

        deepEqual(getTags('<script><a></script><script type="text/x-foo"><b></script><script type="javascript"><c></script>'), [
            ['script', ElementType.Open, 0, 8],
            ['script', ElementType.Close, 11, 20],
            ['script', ElementType.Open, 20, 46],
            ['b', ElementType.Open, 46, 49],
            ['script', ElementType.Close, 49, 58],
            ['script', ElementType.Open, 58, 84],
            ['script', ElementType.Close, 87, 96],
        ]);
    });

    it('CDATA', () => {
        deepEqual(getTags('<a><![CDATA[<foo /><bar>]]><b>'), [
            ['a', ElementType.Open, 0, 3],
            ['b', ElementType.Open, 27, 30]
        ]);

        // Consume unclosed: still a CDATA
        deepEqual(getTags('<a><![CDATA[<foo /><bar><b>'), [
            ['a', ElementType.Open, 0, 3],
        ]);
    });

    it('comments', () => {
        deepEqual(getTags('<a><!-- <foo /><bar> --><b>'), [
            ['a', ElementType.Open, 0, 3],
            ['b', ElementType.Open, 24, 27]
        ]);

        // Consume unclosed: still a comment
        deepEqual(getTags('<a><!-- <foo /><bar><b>'), [
            ['a', ElementType.Open, 0, 3],
        ]);
    });
});
