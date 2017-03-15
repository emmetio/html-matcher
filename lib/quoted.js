'use strict';

import token from './token';

const DOUBLE_QUOTE = 34; // "
const SINGLE_QUOTE = 39; // '

/**
 * Consumes quoted literal from current stream position
 * @param  {ContentStreamReader} stream
 * @param  {Boolean} skipQuotes Skip quotes from output token ranges
 * @return {String} Returns `null` if unable to consume quoted value from current
 * position
 */
export function eatQuoted(stream, skipQuotes) {
	if (!isQuote(stream.peek())) {
		return null;
	}

	const startQuoted = stream.location;
	const quote = stream.next();
	const startUnquoted = stream.location;

	let loc;
	while (!stream.eof()) {
		loc = stream.location;
		if (stream.next() === quote) {
			return skipQuotes ? token(stream, startUnquoted, loc) : token(stream, startQuoted);
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
