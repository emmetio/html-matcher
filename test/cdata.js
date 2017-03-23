'use strict';

const assert = require('assert');
const StreamReader = require('@emmetio/stream-reader');
require('babel-register');
const consumeCDATA = require('../lib/cdata').default;
const cdata = str => consumeCDATA(new StreamReader(str));

describe('CDATA', () => {
	it('consume', () => {
		let c = cdata('<![CDATA[ foo - bar ]]>');
		assert.equal(c.type, 'cdata');
		assert.equal(c.start, 0);
		assert.equal(c.end, 23);

		// consume unclosed: still a cdata
		c = cdata('<![CDATA[ foo - bar');
		assert.equal(c.type, 'cdata');
		assert.equal(c.start, 0);
		assert.equal(c.end, 19);

		// do not consume
		c = cdata('<! [CDATA [ foo - bar ] ]>');
		assert(!c);
	});
});
