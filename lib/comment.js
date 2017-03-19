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
 * @param  {ContentStreamReader} stream
 * @return {Token}
 */
export default function(stream) {
	const start = stream.location;
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

	// unable to find comment, revet to initial position
	stream.location = start;
	return null;
}

/**
 * Consumes comment in backward direction, from end to beginning
 * @param  {ContentStreamReader} stream
 * @param  {Boolean} [lookForward] Look forwrad for comment close instead of backward. 
 * @return {Token}
 */
export function backwardComment(stream, lookForward) {
	const start = stream.location;

	if (lookForward ? eat(stream, commentClose) : eatBack(stream, commentClose)) {
		const end = lookForward ? stream.location : start;

		while (!stream.sof()) {
			if (eatBack(stream, commentOpen)) {
				return comment(stream, stream.location, end);
			} else {
				stream.backUp();
			}
		}

		// Invalid comment
		throw new Error(`Invalid comment end at ${start}`);
	}

	stream.location = start;
	return false;
}

function eat(stream, codes) {
	const start = stream.location;

	for (let i = 0; i < codes.length; i++) {
		if (!stream.eat(codes[i])) {
			stream.location = start;
			return false;
		}
	}

	return true;
}

function eatBack(stream, codes) {
	const start = stream.location;

	for (let i = codes.length - 1; i >= 0; i--) {
		if (!stream.eatBack(codes[i])) {
			stream.location = start;
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
