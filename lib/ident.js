'use strict';

import { eatToken, isAlphaNumeric } from './utils';

const COLON      = 58; // :
const DASH       = 45; // -
const DOT        = 46; // .
const UNDERSCORE = 95; // _

/**
 * Eats HTML identifier (tag or attribute name) from given stream
 * @param  {ContentStreamReader} stream
 * @return {Token}
 */
export function eatIdent(stream) {
	return eatToken(stream, isIdent);
}

/**
 * Check if given character code can be used as HTML/XML identifier (tag or
 * attribute name)
 * @param  {Number}  code
 * @return {Boolean}
 */
export function isIdent(code) {
	return isAlphaNumeric(code)
		|| code === COLON // colon is used for namespaces
		|| code === DOT   // in rare cases declarative tag names may have dots in names
		|| code === DASH
		|| code === UNDERSCORE;
}
