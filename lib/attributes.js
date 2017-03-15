'use strict';

import token from './token';
import { eatIdent } from './ident';
import { eatQuoted, isQuote } from './quoted';
import { eatPaired } from './paired';
import { eatWhile, eatSpace, isSpace } from './utils';

const EQUALS       = 61; // =
const RIGHT_ANGLE  = 62; // >
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
		eatSpace(stream);
		attr = { start: stream.location };

		// A name could be a regular name or expression:
		// React-style – <div {...props}>
		// Angular-style – <div [ng-for]>
		if (attr.name = (eatIdent(stream) || eatPaired(stream))) {
			// Consumed attribute name. Can be an attribute with name
			// or boolean attribute. The value can be React-like expression
			if (stream.eat(EQUALS)) {
				attr.value = eatQuoted(stream, true) || eatPaired(stream) || eatUnquoted(stream);
			} else {
				attr.boolean = true;
			}
			attr.end = stream.location;
			result.push(attr);
		} else if (stream.peek() === RIGHT_ANGLE) {
			// look for tag terminator in order to skip any other possible characters
			// (maybe junk)
			break;
		} else {
			stream.next();
		}
	}

	return result;
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
