'use strict';

import { eatQuoted, isSpace, isQuote } from '@emmetio/stream-reader-utils';
import eatPaired from './paired';
import token from './token';

const SLASH        = 47;  // /
const EQUALS       = 61;  // =
const RIGHT_ANGLE  = 62;  // >

/**
 * Consumes attributes from given stream
 * @param {StreamReader} stream
 * @return {Array} Array of consumed attributes
 */
export default function(stream) {
	const result = [];
	let name, value, attr;

	while (!stream.eof()) {
		stream.eatWhile(isSpace);
		attr = { start: stream.pos };

		// A name could be a regular name or expression:
		// React-style – <div {...props}>
		// Angular-style – <div [ng-for]>
		if (attr.name = eatAttributeName(stream)) {
			// Consumed attribute name. Can be an attribute with name
			// or boolean attribute. The value can be React-like expression
			if (stream.eat(EQUALS)) {
				attr.value = eatAttributeValue(stream);
			} else {
				attr.boolean = true;
			}
			attr.end = stream.pos;
			result.push(attr);
		} else if (isTerminator(stream.peek())) {
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
 * Consumes attribute name from current location
 * @param  {StreamReader} stream
 * @return {Token}
 */
function eatAttributeName(stream) {
	return eatPaired(stream) || token(stream, isAttributeName);
}

/**
 * Consumes attribute value from given location
 * @param  {StreamReader} stream
 * @return {Token}
 */
function eatAttributeValue(stream) {
	const start = stream.pos;
	if (eatQuoted(stream)) {
		// Should return token that points to unquoted value.
		// Use stream readers’ public API to traverse instead of direct
		// manipulation
		const current = stream.pos;
		let valueStart, valueEnd;

		stream.pos = start;
		stream.next();
		valueStart = stream.start = stream.pos;

		stream.pos = current;
		stream.backUp(1);
		valueEnd = stream.pos;

		const result = token(stream, valueStart, valueEnd);
		stream.pos = current;
		return result;
	}

	return eatPaired(stream) || eatUnquoted(stream);
}

/**
 * Check if given code belongs to attribute name.
 * NB some custom HTML variations allow non-default values in name, like `*ngFor`
 * @param  {Number}  code
 * @return {Boolean}
 */
function isAttributeName(code) {
	return code !== EQUALS && !isTerminator(code) && !isSpace(code);
}

/**
 * Check if given code is tag terminator
 * @param  {Number}  code
 * @return {Boolean}
 */
function isTerminator(code) {
	return code === RIGHT_ANGLE || code === SLASH;
}

/**
 * Eats unquoted value from stream
 * @param  {StreamReader} stream
 * @return {Token}
 */
function eatUnquoted(stream) {
	return token(stream, isUnquoted);
}

/**
 * Check if given character code is valid unquoted value
 * @param  {Number}  code
 * @return {Boolean}
 */
function isUnquoted(code) {
	return !isNaN(code) && !isQuote(code) && !isSpace(code) && !isTerminator(code);
}
