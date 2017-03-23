'use strict';

/**
 * A token factory method
 * @param  {StreamReader}   stream
 * @param  {Point|Function} start  Tokens’ start location or stream consumer
 * @param  {Point}          [end]  Tokens’ end location
 * @return {Token}
 */
export default function(stream, start, end) {
	return typeof start === 'function'
		? eatToken(stream, start)
		: new Token(stream, start, end);
}

/**
 * Consumes characters from given stream that matches `fn` call and returns it
 * as token, if consumed
 * @param  {StreamReader} stream
 * @param  {Function} test
 * @return {Token}
 */
export function eatToken(stream, test) {
	const start = stream.pos;
	if (stream.eatWhile(test)) {
		return new Token(stream, start, stream.pos);
	}

	stream.pos = start;
}

/**
 * A structure describing text fragment in content stream
 */
export class Token {
	/**
	 * @param {ContentStreamReader} stream
	 * @param {Point} start         Tokens’ start location in content stream
	 * @param {Point} end           Tokens’ end location in content stream
	 */
	constructor(stream, start, end) {
		this.stream = stream;
		this.start = start != null ? start : stream.start;
		this.end   = end   != null ? end   : stream.pos;
		this._value = null;
	}

	/**
	 * Returns token textual value
	 * NB implemented as getter to reduce unnecessary memory allocations for
	 * strings that not required
	 * @return {String}
	 */
	get value() {
		if (this._value === null) {
			const start = this.stream.start;
			const end = this.stream.pos;

			this.stream.start = this.start;
			this.stream.pos = this.end;
			this._value = this.stream.current();

			this.stream.start = start;
			this.stream.pos = end;
		}

		return this._value;
	}

	toString() {
		return this.value;
	}

	valueOf() {
		return `${this.value} [${this.start}; ${this.end}]`;
	}
}
