'use strict';

const assert = require('assert');
require('babel-register');
const parseTag = require('../lib/tag').default;

describe('Parse tag', () => {
	it('basic', () => {
		let m = parseTag('<div>');
		assert.equal(m.type, 'open');
		assert.equal(m.name.value, 'div');
		assert.deepEqual(m.name.start, {cursor: 0, pos: 1});
		assert.deepEqual(m.name.end, {cursor: 0, pos: 4});
		assert(!m.selfClosing);
		assert(!m.attributes);

		m = parseTag('<div>foo');
		assert.deepEqual(m.start, {cursor: 0, pos: 0});
		assert.deepEqual(m.end, {cursor: 0, pos: 5});
		assert.equal(m.name.value, 'div');
		assert.deepEqual(m.name.start, {cursor: 0, pos: 1});
		assert.deepEqual(m.name.end, {cursor: 0, pos: 4});

		m = parseTag('</div>foo');
		assert.deepEqual(m.start, {cursor: 0, pos: 0});
		assert.deepEqual(m.end, {cursor: 0, pos: 6});
		assert.equal(m.name.value, 'div');
		assert.deepEqual(m.name.start, {cursor: 0, pos: 2});
		assert.deepEqual(m.name.end, {cursor: 0, pos: 5});

		// should not parse, invalid definition
		assert(!parseTag('</ div>'));
		assert(!parseTag('<div'));
		assert(!parseTag('< 1'));
	});
});
