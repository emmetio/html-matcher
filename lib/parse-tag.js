'use strict';

import ContentStreamReader from './content-stream-reader';

const LEFT_ANGLE  = 60; // <
const RIGHT_ANGLE = 62; // >

/**
 * Parses tag definition (open or close tag) from given stream state
 * @param {ContentReader} content    Content stream reader
 * @param {*}             cursor     Pointer to a code chunk in content reader
 * @param {Number}        [position] Character position in code chunk for given
 *                                   `cursor` where to start parsing. Default is 0
 * @return {Object}
 */
export default function(content, cursor, position) {
	let stream = new ContentStreamReader(content.get(cursor), position);

	while (!stream.eof()) {

	}
}
