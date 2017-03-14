'use strict';

import ContentStreamReader from './content-stream-reader';
import eatAttributes from './attributes';
import token from './token';
import { eatIdent } from './ident';
import { eatSpace } from './utils';

const LEFT_ANGLE  = 60; // <
const RIGHT_ANGLE = 62; // >
const SLASH       = 47; // /

/**
 * Parses tag definition (open or close tag) from given stream state
 * @param {Sreing|ContentReader} content Content stream reader
 * @param {Number}               [pos]   Initial search position of character
 *                                       in current state of content reader.
 * @return {Object}
 */
export default function(content, pos) {
	const stream = new ContentStreamReader(content, pos);

	if (stream.peek() !== LEFT_ANGLE) {
		return null;
	}

	const model = {
		start: stream.location,
		end: null
	};

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
