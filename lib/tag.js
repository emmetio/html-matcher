'use strict';

import ContentStreamReader from './content-stream-reader';
import eatAttributes from './attributes';
import token from './token';
import { eatIdent } from './ident';
import { eatSpace } from './utils';

const SLASH       = 47; // /
const LEFT_ANGLE  = 60; // <
const RIGHT_ANGLE = 62; // >

/**
 * Parses tag definition (open or close tag) from given stream state
 * @param {ContentStreamReader} stream Content stream reader
 * @param {Number}              [pos]  Initial search position of character
 *                                     in current state of content reader.
 * @return {Object}
 */
export default function(stream, pos) {
	const start = stream.location;
	const model = {};

	if (stream.eat(LEFT_ANGLE)) {
		model.type = stream.eat(SLASH) ? 'close' : 'open';

		if (model.name = eatIdent(stream)) {
			if (model.type !== 'close') {
				model.attributes = eatAttributes(stream);
				eatSpace(stream);
				model.selfClosing = stream.eat(SLASH);
			}

			if (stream.eat(RIGHT_ANGLE)) {
				// tag properly closed
				return Object.assign(token(stream, start), model);
			}
		}
	}

	// invalid tag, revert to original position
	stream.location = start;
	return null;
}
