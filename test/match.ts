import { strictEqual as equal, deepStrictEqual as deepEqual } from 'assert';
import match from '../src';

const html = `<ul>
    <li><a href="">text <img src="foo.png"><link rel="sample"> <b></b></a></li>
    <li><a href="">text <b></b></a></li>
</ul>`;

const xml = `<ul>
    <li><a href="">text
        <img src="foo.png">
            <link rel="sample" />
        </img>
        <b></b>
    </a></li>
    <li><a href="">text <b></b></a></li>
</ul>`;

describe('Match', () => {
    it('html', () => {
        let tag = match(html, 12);
        equal(tag.name, 'li');
        deepEqual(tag.attributes, []);
        deepEqual(tag.open, [9, 13]);
        deepEqual(tag.close, [79, 84]);

        // Match `<img>` tag. Since in HTML mode, it should be handled as self-closed
        tag = match(html, 37);
        equal(tag.name, 'img');
        deepEqual(tag.attributes, [{
            name: 'src',
            value: '"foo.png"',
            nameStart: 34,
            nameEnd: 37,
            valueStart: 38,
            valueEnd: 47
        }]);
        deepEqual(tag.open, [29, 48]);
        deepEqual(tag.close, undefined);

        tag = match(html, 116);
        equal(tag.name, 'a');
        deepEqual(tag.attributes, [{
            name: 'href',
            value: '""',
            nameStart: 96,
            nameEnd: 100,
            valueStart: 101,
            valueEnd: 103
        }]);
        deepEqual(tag.open, [93, 104]);
        deepEqual(tag.close, [116, 120]);
    });

    it('xml', () => {
        // Should match <img> tag, since we’re in XML mode, matcher should look
        // for closing `</img>` tag
        let tag = match(xml, 42, { xml: true });
        equal(tag.name, 'img');
        deepEqual(tag.attributes, [{
            name: 'src',
            value: '"foo.png"',
            nameStart: 42,
            nameEnd: 45,
            valueStart: 46,
            valueEnd: 55
        }]);
        deepEqual(tag.open, [37, 56]);
        deepEqual(tag.close, [99, 105]);

        tag = match(xml, 70, { xml: true });
        equal(tag.name, 'link');
        deepEqual(tag.attributes, [{
            name: 'rel',
            value: '"sample"',
            nameStart: 75,
            nameEnd: 78,
            valueStart: 79,
            valueEnd: 87
        }]);
        deepEqual(tag.open, [69, 90]);
        deepEqual(tag.close, undefined);
    });
});
