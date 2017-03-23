'use strict';

const assert = require('assert');
const StreamReader = require('@emmetio/stream-reader');
require('babel-register');
const parseTag = require('../lib/tag').default;
const tag = str => parseTag(new StreamReader(str));

describe('Tag', () => {
	it('basic', () => {
		let m = tag('<div>');
		assert.equal(m.type, 'open');
		assert.equal(m.name.value, 'div');
		assert.equal(m.start, 0);
		assert.equal(m.end, 5);
		assert.equal(m.name.start, 1);
		assert.equal(m.name.end, 4);
		assert.deepEqual(m.attributes, []);
		assert(!m.selfClosing);

		m = tag('<div>foo');
		assert.equal(m.start, 0);
		assert.equal(m.end, 5);
		assert.equal(m.name.value, 'div');
		assert.equal(m.name.start, 1);
		assert.equal(m.name.end, 4);

		m = tag('</div>foo');
		assert.equal(m.start, 0);
		assert.equal(m.end, 6);
		assert.equal(m.name.value, 'div');
		assert.equal(m.name.start, 2);
		assert.equal(m.name.end, 5);

		m = tag('<br />');
		assert(m.selfClosing);
		assert.equal(m.start, 0);
		assert.equal(m.end, 6);
		assert.equal(m.name.value, 'br');
		assert.equal(m.name.start, 1);
		assert.equal(m.name.end, 3);

		// should not parse, invalid definition
		assert(!tag('</ div>'));
		assert(!tag('<div'));
		assert(!tag('< 1'));
	});

	it('attributes', () => {
		let m = tag('<div a="b">');
		assert.equal(m.type, 'open');
		assert.equal(m.start, 0);
		assert.equal(m.end, 11);
		assert.equal(m.name.value, 'div');
		assert.equal(m.name.start, 1);
		assert.equal(m.name.end, 4);
		assert.equal(m.attributes.length, 1);

		let attr = m.attributes[0];
		assert.equal(attr.start, 5);
		assert.equal(attr.end, 10);
		assert.equal(attr.name.value, 'a');
		assert.equal(attr.name.start, 5);
		assert.equal(attr.name.end, 6);
		assert.equal(attr.value.value, 'b');

		m = tag('<div foo bar=baz   class="test">text');
		assert.equal(m.type, 'open');
		assert.equal(m.start, 0);
		assert.equal(m.end, 32);
		assert.equal(m.attributes.length, 3);

		attr = m.attributes[0];
		assert.equal(attr.start, 5);
		assert.equal(attr.end, 8);
		assert.equal(attr.name.value, 'foo');
		assert.equal(attr.value, undefined);
		assert.equal(attr.boolean, true);

		attr = m.attributes[0];
		assert.equal(attr.start, 5);
		assert.equal(attr.end, 8);
		assert.equal(attr.name.value, 'foo');
		assert.equal(attr.value, undefined);
		assert(attr.boolean);

		attr = m.attributes[1];
		assert.equal(attr.start, 9);
		assert.equal(attr.end, 16);
		assert.equal(attr.name.value, 'bar');
		assert.equal(attr.value.value, 'baz');
		assert(!attr.boolean);

		attr = m.attributes[2];
		assert.deepEqual(attr.start, 19);
		assert.deepEqual(attr.end, 31);
		assert.equal(attr.name.value, 'class');
		assert.equal(attr.value.value, 'test');
		assert(!attr.boolean);
	});

	it('expressions in attributes', () => {
		let m = tag('<div a={foo} {...bar}>');
		assert.equal(m.type, 'open');
		assert.equal(m.start, 0);
		assert.equal(m.end, 22);
		assert.equal(m.name.value, 'div');
		assert.equal(m.attributes.length, 2);

		let attr = m.attributes[0];
		assert.equal(attr.name.value, 'a');
		assert.equal(attr.value.value, '{foo}');

		attr = m.attributes[1];
		assert.equal(attr.name.value, '{...bar}');
		assert(!attr.value);
		assert(attr.boolean);

		m = tag('<div [ng-click]="test" <?= $some_php; ?>>')
		assert.equal(m.type, 'open');
		assert.equal(m.start, 0);
		assert.equal(m.end, 41);
		assert.equal(m.name.value, 'div');
		assert.equal(m.attributes.length, 2);

		attr = m.attributes[0];
		assert.equal(attr.name.value, '[ng-click]');
		assert.equal(attr.value.value, 'test');

		attr = m.attributes[1];
		assert.equal(attr.name.value, '<?= $some_php; ?>');
		assert(!attr.value);
		assert(attr.boolean);

		m = tag('<div *ng-for="test" />');
		assert.equal(m.attributes.length, 1);

		attr = m.attributes[0];
		assert.equal(attr.name.value, '*ng-for');
		assert.equal(attr.value.value, 'test');
	});
});
