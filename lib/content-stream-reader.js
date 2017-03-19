'use strict';

import ContentReader from './content-reader';

export default class ContentStreamReader {
	/**
	 * @param {ContentReader} content A `ContentReader`-compliant streaming reader
	 * @param {Number}        [pos]   Character location of initial search position
	 *                                of current cursor
	 */
	constructor(content, pos) {
		this.content = typeof content === 'string' ? new ContentReader(content) : content;
		this.cursor = this.content.cursor;
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

	get pos() {
		return this._pos;
	}

	set pos(value) {
		this._pos = value;
		this._location = null;
	}

	get location() {
		if (!this._location) {
			this._location = new Point(this.cursor, this.pos);
		}
		return this._location;
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

	_next() {
		if (!this.eof()) {
			if (this.eol()) {
				this.cursor = this.content.next(this.cursor);
			}

			return this.pos++;
		}
	}

	/**
	 * Returns the next character code in the stream and advances it.
	 * Also returns `undefined` when no more characters are available.
	 * May return `NaN` is stream pointer advanced to empty line (valid state!)
	 * @returns {Number|NaN}
	 */
	next() {
		const pos = this._next();
		return pos != null ? this.chunk.charCodeAt(pos) : undefined;
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
	 * @param {Number|Function|Regexp} match
	 * @returns {Boolean}
	 */
	eat(match) {
		let ok;
		const ch = this.peek();

		if (typeof match === 'number') {
			ok = ch === match;
		} else {
			ok = ch && (match.test ? match.test(ch) : match(ch));
		}

		if (ok) {
			this._next();
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

			if (cursor !== to.cursor) {
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

	/**
	 * Moves stream location by one character back
	 * @return {Point} Returns `true` if location was updated
	 */
	back() {
		if (this.pos) {
			this.pos--;
			return true;
		}

		if (this.sof()) {
			return false;
		}

		this.cursor = this.content.prev(this.cursor);
		this.pos = this.chunk.length - 1;
		return true;
	}

	eatBack(code) {
		if (this.back() && this.peek() === code) {
			return true;
		}

		this._next();
		return false;
	}

	/**
	 * Compare two points (character locations) of stream
	 * @param  {Point} p1
	 * @param  {Point} p2
	 * @return {Number} less than 0, 0, greater than 0
	 */
	compare(p1, p2) {
		return this.content.compare(p1.cursor, p2.cursor) || p1.pos - p2.pos;
	};
}

/**
 * A data structure for describing character position in content-stream-reader
 * stream reader
 */
export class Point {
	constructor(cursor, pos) {
		this.cursor = cursor;
		this.pos = pos;
	}

	toString() {
		return `${this.cursor},${this.pos}`;
	}
}
