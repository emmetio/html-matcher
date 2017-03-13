'use strict';

const assert = require('assert');
require('babel-register');
const ContentStreamReader = require('../lib/content-stream-reader').default;

describe('Content Stream Reader', () => {
	const code = ch => ch.charCodeAt(0);

	describe('Line reader', () => {
		class LineContentReader {
			constructor(content) {
				this.lines = content.split(/\r\n|\n|r/g);
			}

			get(cursor) {
				return this.lines[cursor];
			}

			next(cursor) {
				return cursor < this.lines.length - 1 ? cursor + 1 : null;
			}

			prev(cursor) {
				return cursor > 0 ? cursor - 1 : null;
			}
		}

		it('read from stream', () => {
			const content = new LineContentReader('abc\nde\n\nf');
			const stream = new ContentStreamReader(content, 0);

			assert(stream.sof());
			assert(!stream.eof());
			assert.equal(stream.chunk, 'abc');

			assert.equal(stream.peek(), code('a'));
			assert.equal(stream.peek(), code('a'));

			assert.equal(stream.next(), code('a'));
			assert.equal(stream.next(), code('b'));
			assert.equal(stream.next(), code('c'));

			// next line
			assert.equal(stream.peek(), code('d'));
			assert.equal(stream.next(), code('d'));
			assert.equal(stream.next(), code('e'));
			assert.equal(stream.chunk, 'de');

			// next line
			assert(isNaN(stream.next()));
			assert.equal(stream.chunk, '');

			// last line
			assert.equal(stream.peek(), code('f'));
			assert.equal(stream.next(), code('f'));
			assert(!stream.sof());
			assert(stream.eof());

			assert.equal(stream.next(), undefined);
		});

		it('substring', () => {
			const content = new LineContentReader('abc\nde\n\nf');
			const stream = new ContentStreamReader(content, 1, 1);
			assert.equal(stream.next(), code('e'));
			assert.equal(stream.current(), 'e');

			// NB it’s OK that line breaks are skipped here since the most
			// valuable part of stream reader is it’s `.location`, which will be
			// translated to host editor space afterwards
			stream.next();
			assert.equal(stream.current(), 'e');

			stream.next();
			assert.equal(stream.current(), 'ef');
		});

		it('back-up', () => {
			const content = new LineContentReader('abc\nde\n\nf');
			const stream = new ContentStreamReader(content, 3, 1);

			assert(stream.eof());
			stream.backUp();

			assert.equal(stream.peek(), code('f'));

			stream.backUp(3);
			assert.equal(stream.peek(), code('d'));
		});
	});
});
