'use strict';

import { isSpace, isAlphaNumeric } from '@emmetio/stream-reader-utils';
import eatAttributes from './attributes';
import token from './token';

const DASH        = 45; // -
const DOT         = 46; // .
const SLASH       = 47; // /
const COLON       = 58; // :
const LEFT_ANGLE  = 60; // <
const RIGHT_ANGLE = 62; // >
const UNDERSCORE  = 95; // _

/**
 * Parses tag definition (open or close tag) from given stream state
 * @param {StreamReader} stream Content stream reader
 * @return {Object}
 */
export default function(stream) {
	const start = stream.pos;

	if (stream.eat(LEFT_ANGLE)) {
		const model = { type: stream.eat(SLASH) ? 'close' : 'open' };

		if (model.name = eatTagName(stream)) {
			if (model.type !== 'close') {
				model.attributes = eatAttributes(stream);
				stream.eatWhile(isSpace);
				model.selfClosing = stream.eat(SLASH);
			}

			if (stream.eat(RIGHT_ANGLE)) {
				// tag properly closed
				return Object.assign(token(stream, start), model);
			}
		}
	}

	// invalid tag, revert to original position
	stream.pos = start;
	return null;
}

/**
 * Eats HTML identifier (tag or attribute name) from given stream
 * @param  {StreamReader} stream
 * @return {Token}
 */
export function eatTagName(stream) {
	return token(stream, isTagName);
}

/**
 * Check if given character code can be used as HTML/XML tag name
 * @param  {Number}  code
 * @return {Boolean}
 */
export function isTagName(code) {
	return isAlphaNumeric(code)
		|| code === COLON // colon is used for namespaces
		|| code === DOT   // in rare cases declarative tag names may have dots in names
		|| code === DASH
		|| code === UNDERSCORE;
}
