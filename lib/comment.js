'use strict';

import token from './token';

const EXCL        = 33; // -
const DASH        = 45; // -
const LEFT_ANGLE  = 60; // <
const RIGHT_ANGLE = 62; // >

const commentOpen  = [LEFT_ANGLE, EXCL, DASH, DASH];
const commentClose = [DASH, DASH, RIGHT_ANGLE];

/**
 * Consumes HTML comment from given stream
 * @param  {StreamReader} stream
 * @return {Token}
 */
export default function(stream) {
	const start = stream.pos;
	if (eat(stream, commentOpen)) {
		// consumed `<!--`, read next until we find ending part or reach the end of input
		while (!stream.eof()) {
			if (eat(stream, commentClose)) {
				break;
			} else {
				stream.next();
			}
		}

		// even if we didn’t found comment closing, we’re still in comment
		return comment(stream, start);
	}

	// unable to find comment, revert to initial position
	stream.pos = start;
	return null;
}

function eat(stream, codes) {
	const start = stream.pos;

	for (let i = 0; i < codes.length; i++) {
		if (!stream.eat(codes[i])) {
			stream.pos = start;
			return false;
		}
	}

	return true;
}

function comment(stream, start, end) {
	const result = token(stream, start, end);
	result.type = 'comment';
	return result;
}
