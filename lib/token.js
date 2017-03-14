'use strict';

/**
 * A token factory method
 * @param  {ContentStreamReader|String} value Token value
 * @param  {Object} start Tokens’ start location
 * @param  {Object} end   Tokens’ end location
 * @return {Token}
 */
export default function(value, start, end) {
	if (value && typeof value === 'object') {
		// a stream reader is passed
		end = end == null ? value.location : end;
		value = value.substring(start, end);

	}
	return new Token(value, start, end);
}

/**
 * A structure describing text fragment in content stream
 */
export class Token {
	/**
	 * @param {String}   value Token value
	 * @param {Point} start Tokens’ start location in content stream
	 * @param {Point} end   Tokens’ end location in content stream
	 */
	constructor(value, start, end) {
		this.value = value;
		this.start = start;
		this.end = end;
	}

	toString() {
		return this.value;
	}

	valueOf() {
		return `${this.value} [${this.start}; ${this.end}]`;
	}
}
