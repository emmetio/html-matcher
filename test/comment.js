'use strict';

const assert = require('assert');
require('babel-register');
const ContentStreamReader = require('../lib/content-stream-reader').default;
const consumeComment = require('../lib/comment').default;
const consumeCommentBackward = require('../lib/comment').backwardComment;
const comment = str => consumeComment(new ContentStreamReader(str));
const backwardComment = str => consumeCommentBackward(new ContentStreamReader(str, str.length));

describe('Comment', () => {
	it('consume forward', () => {
		let c = comment('<!-- foo - bar -->');
		assert.deepEqual(c.type, 'comment');
		assert.deepEqual(c.start, {cursor: 0, pos: 0});
		assert.deepEqual(c.end, {cursor: 0, pos: 18});

		// consume unclosed: still a comment
		c = comment('<!-- foo - bar');
		assert.deepEqual(c.type, 'comment');
		assert.deepEqual(c.start, {cursor: 0, pos: 0});
		assert.deepEqual(c.end, {cursor: 0, pos: 14});

		// do not consume
		c = comment('<! -- foo - bar -- >');
		assert(!c);
	});

	it('consume backward', () => {
		let c = backwardComment('test <!-- foo - bar -->');
		assert.deepEqual(c.type, 'comment');
		assert.deepEqual(c.start, {cursor: 0, pos: 5});
		assert.deepEqual(c.end, {cursor: 0, pos: 23});

		// do not consume
		c = comment('<! -- foo - bar -- >');
		assert(!c);
	});
});
