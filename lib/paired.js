'use strict';

import token from './token';
import { eatQuoted, eatPair } from '@emmetio/stream-reader-utils';

const LANGLE  = 60,  RANGLE  = 62;  // < and >
const LSQUARE = 91,  RSQUARE = 93;  // [ and ]
const LROUND  = 40,  RROUND  = 41;  // ( and )
const LCURLY  = 123, RCURLY  = 125; // { and }

const opt = { throws: true };

/**
 * Consumes paired tokens (like `[` and `]`) with respect of nesting and embedded
 * quoted values
 * @param  {StreamReader} stream
 * @return {Token} A token with consumed paired character
 */
export default function(stream) {
	const start = stream.pos;
	const consumed = eatPair(stream, LANGLE, RANGLE, opt)
		|| eatPair(stream, LSQUARE, RSQUARE, opt)
		|| eatPair(stream, LROUND,  RROUND,  opt)
		|| eatPair(stream, LCURLY,  RCURLY,  opt);

	if (consumed) {
		return token(stream, start);
	}
}
