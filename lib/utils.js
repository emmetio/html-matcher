'use strict';

import token from './token';

/**
 * Consumes characters in given string while they pass `test` code test
 * @param  {ContentStreamReader} stream
 * @param  {Function} test
 * @return {Boolean} Returns `true` stream was consumed at least once
 */
export function eatWhile(stream, test) {
	const start = stream.location;

	while (!stream.eof()) {
		if (!test(stream.next())) {
			stream.back();
			break;
		}
	}

	return start.cursor !== stream.cursor || start.pos !== stream.pos;
}

/**
 * Consumes characters from given stream that matches `fn` call and returns it
 * as token, if consumed
 * @param  {ContentStreamReader} stream
 * @param  {Function} test
 * @return {Token}
 */
export function eatToken(stream, test) {
	const start = stream.location;
	if (eatWhile(stream, test)) {
		return token(stream, start);
	}
}

/**
 * Eats space characters from stream
 * @param  {ContentStreamReader} stream
 * @return {Boolean} Returns `true` if whitespace was consumed
 */
export function eatSpace(stream) {
	return eatWhile(stream, isSpace);
}

/**
 * Check if given code is a number
 * @param  {Number}  code
 * @return {Boolean}
 */
export function isNumber(code) {
	return code > 47 && code < 58;
}

/**
 * Check if given character code is alpha code (letter through A to Z)
 * @param  {Number}  code
 * @param  {Number}  [from]
 * @param  {Number}  [to]
 * @return {Boolean}
 */
export function isAlpha(code, from, to) {
	from = from || 65; // A
	to   = to   || 90; // Z
	code &= ~32; // quick hack to convert any char code to uppercase char code

	return code >= from && code <= to;
}

/**
 * Check if given character code is alphanumeric code (letter through A to Z and numbers)
 * @param  {Number}  code
 * @return {Boolean}
 */
export function isAlphaNumeric(code) {
	return isNumber(code) || isAlpha(code);
}

/**
 * Check if given character code is a white-space
 * @param  {Number}  code
 * @return {Boolean}
 */
export function isWhiteSpace(code) {
	return code === 32   /* space */
		|| code === 9    /* tab */
		|| code === 160; /* non-breaking space */
}

/**
 * Check if given character code is a space
 * @param  {Number}  code
 * @return {Boolean}
 */
export function isSpace(code) {
	return isWhiteSpace(code)
		|| code === 10  /* LF */
		|| code === 13; /* CR */
}
