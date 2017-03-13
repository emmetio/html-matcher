'use strict';

import token from './token';

const DOUBLE_QUOTE = 34; // "
const SINGLE_QUOTE = 39; // '

/**
 * Consumes quoted literal from current stream position
 * @param  {ContentStreamReader} stream
 * @return {String} Returns `null` if unable to consume quoted value from current
 * position
 */
export function eatQuoted(stream) {
	if (!isQuote(stream.peek())) {
		return null;
	}

	const start = stream.location;
	const quote = stream.next();

	while (!stream.eof()) {
		if (stream.eat(quote)) {
			return token(stream, start);
		}
	}

	throw new Error(`Unable to find matching ${String.fromCharCode(quote)} for string literal at ${JSON.stringify(start)}`);
}

/**
 * Check if given character quote is a valid quote
 * @param  {Number}  ch
 * @return {Boolean}
 */
export function isQuote(ch) {
	return ch === SINGLE_QUOTE || ch === DOUBLE_QUOTE;
}
