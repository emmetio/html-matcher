'use strict';

const assert = require('assert');
require('babel-register');
const ContentStreamReader = require('../lib/content-stream-reader').default;

describe('Content Stream Reader', () => {
	const code = ch => ch.charCodeAt(0);
	const CR = code('\n');

	describe('Line reader', () => {
		class LineContentReader {
			constructor(content, cursor) {
				this.lines = content.split(/\r\n|\n|r/g);
				this.cursor = cursor || 0;
			}

			length(cursor) {
				const lineFeedLength = this.next(cursor) !== null ? 1 : 0;
				return this.lines[cursor].length + lineFeedLength;
			}

			charCodeAt(cursor, pos) {
				const lastLine = this.next(cursor) === null;
				return pos === this.length(cursor) - 1 && !lastLine
					? CR
					: this.lines[cursor].charCodeAt(pos);
			}

			substring(from, to) {
				if (from.cursor === to.cursor) {
					return this.lines[from.cursor].substring(from.pos, to.pos);
				}

				let result = this.lines[from.cursor].slice(from.pos) + '\n';
				let cursor = from.cursor, chunk;

				while (true) {
					cursor = this.next(cursor);
					if (cursor == null) {
						throw new Error('Unexpected end-of-stream');
					}

					chunk = this.lines[cursor];

					if (cursor !== to.cursor) {
						result += chunk + '\n';
					} else {
						result += chunk.slice(0, to.pos);
						break;
					}
				}

				return result;
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
			const stream = new ContentStreamReader(content);

			assert(stream.sof());
			assert(!stream.eof());

			assert.equal(stream.content.length(stream.cursor), 4);
			assert.equal(stream.peek(), code('a'));
			assert.equal(stream.peek(), code('a')); // no pointer offset

			assert.equal(stream.next(), code('a'));
			assert.equal(stream.next(), code('b'));
			assert.equal(stream.next(), code('c'));
			assert.equal(stream.next(), CR);

			// next line
			assert.equal(stream.peek(), code('d'));
			assert.equal(stream.next(), code('d'));
			assert.equal(stream.next(), code('e'));
			assert.equal(stream.next(), CR);

			// next, empty line
			assert.equal(stream.content.length(stream.cursor), 1);
			assert.equal(stream.next(), CR);

			// last line
			assert.equal(stream.peek(), code('f'));
			assert.equal(stream.next(), code('f'));
			assert(!stream.sof());
			assert(stream.eof());

			assert.equal(stream.next(), undefined);
		});

		it('substring', () => {
			const content = new LineContentReader('abc\nde\n\nf', 1);
			const stream = new ContentStreamReader(content, 1);
			assert.equal(stream.next(), code('e'));
			assert.equal(stream.current(), 'e');

			// NB it’s OK that line breaks are skipped here since the most
			// valuable part of stream reader is it’s `.location`, which will be
			// translated to host editor space afterwards
			stream.next();
			stream.next();
			assert.equal(stream.current(), 'e\n\n');

			stream.next();
			assert.equal(stream.current(), 'e\n\nf');
		});

		it('back-up', () => {
			const content = new LineContentReader('abc\nde\n\nf', 3);
			const stream = new ContentStreamReader(content, 1);

			assert(stream.eof());
			stream.back();
			assert.equal(stream.peek(), code('f'));
		});
	});
});
