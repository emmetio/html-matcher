'use strict';

const assert = require('assert');
const StreamReader = require('@emmetio/stream-reader');
require('babel-register');
const consumeComment = require('../lib/comment').default;
const comment = str => consumeComment(new StreamReader(str));

describe('Comment', () => {
	it('consume', () => {
		let c = comment('<!-- foo - bar -->');
		assert.equal(c.type, 'comment');
		assert.equal(c.start, 0);
		assert.equal(c.end, 18);

		// consume unclosed: still a comment
		c = comment('<!-- foo - bar');
		assert.equal(c.type, 'comment');
		assert.equal(c.start, 0);
		assert.equal(c.end, 14);

		// do not consume
		c = comment('<! -- foo - bar -- >');
		assert(!c);
	});
});
