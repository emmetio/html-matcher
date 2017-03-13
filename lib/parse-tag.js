'use strict';

import ContentStreamReader from './content-stream-reader';
import token from './token';
import { eatIdent } from './ident';
import { eatSpace } from './utils';

const LEFT_ANGLE  = 60; // <
const RIGHT_ANGLE = 62; // >
const SLASH       = 47; // /

/**
 * Parses tag definition (open or close tag) from given stream state
 * @param {ContentReader} content    Content stream reader
 * @param {*}             cursor     Pointer to a code chunk in content reader
 * @param {Number}        [position] Character position in code chunk for given
 *                                   `cursor` where to start parsing. Default is 0
 * @return {Object}
 */
export default function(content, cursor, position) {
	const stream = new ContentStreamReader(content, cursor, position);
	const start = stream.location;

	if (stream.peek() !== LEFT_ANGLE) {
		return null;
	}

	const model = { start };
	stream.eat(LEFT_ANGLE);
	model.type = stream.eat(SLASH) ? 'close' : 'open';

	if (model.name = eatIdent(stream)) {
		if (model.type !== 'close') {
			eatSpace(stream);
			model.attributes = eatAttributes(stream);
			eatSpace(stream);
			model.selfClosing = stream.eat(SLASH);
		}

		if (stream.eat(RIGHT_ANGLE)) {
			// tag properly closed
			model.end = stream.location;
			return model;
		}
	}
}
