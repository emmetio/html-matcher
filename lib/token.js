'use strict';

/**
 * A token factory method
 * @param  {ContentStreamReader} stream
 * @param  {Point} start Tokens’ start location
 * @param  {Point} end   Tokens’ end location
 * @return {Token}
 */
export default function(stream, start, end) {
	return new Token(stream, start, end);
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
		this.start = start || stream.start;
		this.end = end || stream.location;
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
			this._value = this.stream.substring(this.start, this.end);
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
