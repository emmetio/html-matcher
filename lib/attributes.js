'use strict';

import token from './token';
import { eatIdent } from './ident';
import { eatQuoted, isQuote } from './quoted';
import { eatSpace, isSpace } from './utils';

const EQUALS       = 61; // =
const LCURLY_BRACE = 123; // '
const RCURLY_BRACE = 125; // '

/**
 * Consumes attributes from given stream
 * @param {ContentStreamReader} stream
 * @return {Array} Array of consumed attributes
 */
export default function(stream) {
	const result = [];
	let name, value, attr;

	while (!stream.eof()) {
		attr = {};
		eatSpace(stream);

		if (attr.name = eatIdent(stream)) {
			// Consumed attribute name. Can be an attribute with name
			// or boolean attribute
			if (stream.eat(EQUALS)) {
				attr.value = eatQuoted(stream) || eatUnquoted(stream);
			} else {
				attr.boolean = true;
			}

			result.push(attr);
		} else {
			break;
		}
	}
}

/**
 * Eats unquoted value from stream
 * @param  {ContentStreamReader} stream
 * @return {Token}
 */
function eatUnquoted(stream) {
	const start = stream.location;
	if (eatWhile(stream, isUnquoted)) {
		return token(stream, start);
	}
}

/**
 * Check if given character code is valid unquoted value
 * @param  {Number}  code
 * @return {Boolean}
 */
function isUnquoted(code) {
	return !isNaN(code) && !isQuote(code) && !isSpace(code);
}
