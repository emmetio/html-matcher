'use strict';

import token from './token';
import { eatQuoted } from './quoted';

const LANGLE  = 60,  RANGLE  = 62;  // < and >
const LSQUARE = 91,  RSQUARE = 93;  // [ and ]
const LROUND  = 40,  RROUND  = 41;  // ( and )
const LCURLY  = 123, RCURLY  = 125; // { and }

/**
 * Consumes paired tokens (like `[` and `]`) with respect of nesting and embedded
 * quoted values
 * @param  {ContentStreamReader} stream
 * @return {Token} A token with consumed paired character
 */
export function eatPaired(stream) {
	if (isPairStart(stream.peek())) {
		const start = stream.location;
		const left = stream.next();
		const right = getPair(left);
		let stack = 1, ch;

		while (!stream.eof()) {
			if (eatQuoted(stream)) {
				continue;
			}

			ch = stream.next();
			if (ch === left) {
				stack++;
			} else if (ch === right) {
				stack--;
				if (!stack) {
					return token(stream, start);
				}
			}
		}

		throw new Error(`Unable to find matching pair for ${String.fromCharCode(left)} at ${start}`);
	}
}

/**
 * Check if given character code is a pair start
 * @param  {Number}  code
 * @return {Boolean}
 */
export function isPairStart(code) {
	return code === LANGLE || code === LSQUARE || code === LROUND || code === LCURLY;
}

/**
 * Get pair (closing brace) for given code (opening brace)
 * @param  {Number} code
 * @return {Number}
 */
export function getPair(code) {
	switch (code) {
		case LANGLE:  return RANGLE;
		case LSQUARE: return RSQUARE;
		case LROUND:  return RROUND;
		case LCURLY:  return RCURLY;
	}
}
