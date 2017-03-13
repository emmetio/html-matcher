'use strict';

export default class ContentStreamReader {
	constructor(content, cursor, pos) {
		this.content = content;
		this.cursor = cursor;
		this.pos = pos || 0;
		this.start = this.location;
	}

	get cursor() {
		return this._cursor;
	}

	set cursor(value) {
		if (value !== this.cursor) {
			this._cursor = value;
			this.chunk = this.content.get(value);
			this.pos = 0;
		}
	}

	get location() {
		return {
			cursor: this.cursor,
			pos: this.pos
		};
	}

	set location(value) {
		this.cursor = value.cursor;
		this.pos = value.pos;
	}

	/**
	 * Returns true only if the stream is at the beginning of the whole text.
	 * @returns {Boolean}
	 */
	sof() {
		return this.sol() && this.content.prev(this.cursor) === null;
	}

	/**
	 * Returns true only if the stream is at the end of the whole text.
	 * @returns {Boolean}
	 */
	eof() {
		return this.eol() && this.content.next(this.cursor) === null;
	}

	/**
	 * Returns true only if the stream is at the beginning of current chunk.
	 * @returns {Boolean}
	 */
	sol() {
		return this.pos === 0;
	}

	/**
	 * Returns true only if the stream is at the end of current chunk.
	 * @returns {Boolean}
	 */
	eol() {
		return this.pos >= this.chunk.length;
	}

	/**
	 * Returns the next character code in the stream and advances it.
	 * Also returns `undefined` when no more characters are available.
	 * May return `NaN` is stream pointer advanced to empty line (valid state!)
	 * @returns {Number|NaN}
	 */
	next() {
		if (!this.eof()) {
			if (this.eol()) {
				this.cursor = this.content.next(this.cursor);
			}

			return this.chunk.charCodeAt(this.pos++);
		}
	}

	/**
	 * Returns the next character code in the stream without advancing it.
	 * Will return <code>undefined</code> at the end of the stream.
	 * May return `NaN` is stream pointer advanced to empty line (valid state!)
	 * @returns {Number|NaN}
	 */
	peek() {
		if (!this.eof()) {
			if (this.eol()) {
				const cursor = this.content.next(this.cursor);
				return this.content.get(cursor).charCodeAt(0);
			}

			return this.chunk.charCodeAt(this.pos);
		}
	}

	/**
	 * `match` can be a character, a regular expression, or a function that
	 * takes a character and returns a boolean. If the next character in the
	 * stream 'matches' the given argument, it is consumed and returned.
	 * Otherwise, undefined is returned.
	 * @param {String|Number|Function|Regexp} match
	 * @returns {Boolean}
	 */
	eat(match) {
		let ok;
		const ch = this.peek();

		if (typeof match === 'number') {
			ok = ch === match;
		} else if (typeof match === 'string') {
			ok = ch === match.charCodeAt(0);
		} else {
			ok = ch && (match.test ? match.test(ch) : match(ch));
		}

		if (ok) {
			this.next();
		}

		return ok;
	}

	/**
	 * Repeatedly calls eat with the given argument, until it fails.
	 * @param {Object} match
	 * @returns {Boolean} `true` if any characters were eaten.
	 */
	eatWhile(match) {
		let ok = false;
		while (this.eat(match)) {
			ok = true;
		}
		return ok;
	}

	/**
	 * Get the string between the start of the current token and the
	 * current stream position.
	 * @returns {String}
	 */
	current() {
		return this.substring(this.start, this.location);
	}

	/**
	 * Returns content stream substring for given `start` and `end` locations
	 * @param {Object} start
	 * @param {Object} end
	 * @return {String}
	 */
	substring(from, to) {
		if (from.cursor === to.cursor) {
			return this.content.get(from.cursor).substring(from.pos, to.pos);
		}

		let result = this.content.get(from.cursor).slice(from.pos);
		let cursor = from.cursor, chunk;

		while (true) {
			cursor = this.content.next(cursor);
			if (cursor == null) {
				throw new Error('Unexpected end-of-stream');
			}

			chunk = this.content.get(cursor);

			if (cursor !== end.cursor) {
				result += chunk;
			} else {
				result += chunk.slice(0, to.pos);
				break;
			}
		}

		return result;
	}

	/**
	 * Consumes substring from current stream that matches given `match` argument
	 * and returns it
	 * @return {String}
	 */
	consume(match) {
		this.start = this.pos;
		this.eatWhile(match);
		return this.current();
	}

	backUp(n) {
		n = n || 1;
		while (true) {
			this.pos -= n;
			if (this.pos >= 0) {
				break;
			}

			n = Math.abs(this.pos);

			const cursor = this.content.prev(this.cursor);
			if (cursor == null) {
				// reached start-of-stream
				this.pos = 0;
				break;
			} else {
				this.cursor = cursor;
				if (!this.chunk) {
					n--;
				} else {
					this.pos = this.chunk.length;
				}
			}
		}
	}
}
