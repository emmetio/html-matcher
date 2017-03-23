'use strict';

import token from './token';
import { eatSection, toCharCodes } from './utils';

const open  = toCharCodes('<![CDATA[');
const close = toCharCodes(']]>');

/**
 * Consumes CDATA from given stream
 * @param  {StreamReader} stream
 * @return {Token}
 */
export default function(stream) {
	const start = stream.pos;
	if (eatSection(stream, open, close, true)) {
		const result = token(stream, start);
		result.type = 'cdata';
		return result;
	}

	return null;
}
