import { describe, it } from 'node:test';
import { deepEqual } from 'node:assert/strict';
import { scan, ElementType, type FastScanCallback, type ScannerOptions, createOptions } from '../src';

type TagRecord = [string, ElementType, number, number];

const getTags = (code: string, opt: Partial<ScannerOptions> = {}) => {
    const tags: TagRecord[] = [];
    const cb: FastScanCallback = (name, type, start, end) => tags.push([name, type, start, end]);
    scan(code, cb, createOptions(opt));
    return tags;
};

const phpExample = `<html>
 <body>
 <?php echo '<p>Hello world</p>'; ?>
 </body>
</html>`;

const erbExample = `<ul>
   <% @products.each do |p| %>
      <li><%=  @p.name %></li>
   <% end %>
</ul>`;

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

    it('all tokens', () => {
        deepEqual(getTags('<?xml version="1.0"?><a><!-- <foo /><bar> --><b>'), [
            ['a', ElementType.Open, 21, 24],
            ['b', ElementType.Open, 45, 48]
        ]);

        deepEqual(getTags('<?xml version="1.0"?><a><!-- <foo /><bar> --><b>', { allTokens: true }), [
            ['xml', ElementType.ProcessingInstruction, 0, 21],
            ['a', ElementType.Open, 21, 24],
            ['#comment', ElementType.Comment, 24, 45],
            ['b', ElementType.Open, 45, 48]
        ]);
    });

    it('PHP', () => {
        deepEqual(getTags(phpExample, { allTokens: true }), [
            ['html', ElementType.Open, 0, 6],
            ['body', ElementType.Open, 8, 14],
            ['php', ElementType.ProcessingInstruction, 16, 51],
            ['body', ElementType.Close, 53, 60],
            ['html', ElementType.Close, 61, 68]
        ]);
    });

    it('ERB', () => {
        deepEqual(getTags(erbExample, { allTokens: true }), [
            ['ul', ElementType.Open, 0, 4],
            ['#erb', ElementType.ERB, 8, 35],
            ['li', ElementType.Open, 42, 46],
            ['#erb', ElementType.ERB, 46, 61],
            ['li', ElementType.Close, 61, 66],
            ['#erb', ElementType.ERB, 70, 79],
            ['ul', ElementType.Close, 80, 85]
        ]);
    });
});
