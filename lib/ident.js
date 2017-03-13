'use strict';

import token from './token';
import { eatWhile, isAlpha, isNumber } from './utils';

const COLON = 58; // :
const DOT   = 46; // .

/**
 * Eats HTML identifier (tag or attribute name) from given stream
 * @param  {ContentStreamReader} stream
 * @return {Token}
 */
export function eatIdent(stream) {
	const start = stream.location;
	if (eatWhile(stream, isIdent)) {
		return token(stream, start);
	}
}

/**
 * Check if given character code can be used as HTML/XML identifier (tag or
 * attribute name)
 * @param  {Number}  code
 * @return {Boolean}
 */
export function isIdent(code) {
	return isNumber(code) || isAlpha(code)
		|| code === COLON // colon is used for namespaces
		|| code === DOT;  // in rare cases declarative tag names may have dots in names
}
