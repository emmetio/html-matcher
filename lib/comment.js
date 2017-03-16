'use strict';

import token from './token';

const EXCL        = 33; // -
const DASH        = 45; // -
const LEFT_ANGLE  = 60; // <
const RIGHT_ANGLE = 62; // >

/**
 * Consumes HTML comment from given stream
 */
export default function(stream) {
	const start = stream.location;
	if (stream.eat(LEFT_ANGLE) && stream.eat(EXCL) && stream.eat(DASH) && stream.eat(DASH)) {
		// consumed `<!--`, read next until we find ending part or reach the end of input
		while (!stream.eof()) {
			if (stream.next() === DASH && stream.eat(DASH) && stream.eat(RIGHT_ANGLE)) {
				break;
			}
		}

		// even if we didn’t found comment closing, we’re still in comment
		const result = token(stream, start);
		result.type = 'comment';
		return result;
	}

	// unable to find comment, revet to initial position
	stream.location = start;
	return null;
}
