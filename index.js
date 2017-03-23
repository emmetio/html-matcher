'use strict';

import tag from './lib/tag';
import comment from './lib/comment';
import StreamReader from '@emmetio/stream-reader-utils';

export const defaultOptions = {
	/**
	 * Expect XML content in searching content. It alters how should-be-empty
	 * elements area treated: for example, in XML parser will try to locate
	 * closing pair for `<br>` tag
	 * @type {Boolean}
	 */
	xml: false,

	/**
	 * List of elements that should be treated as empty (e.g. without closing tag)
	 * in non-XML syntax
	 * @type {Array}
	 */
	empty: ['img', 'meta', 'link', 'br', 'base', 'hr', 'area', 'wbr']
};

/**
 * Matches known token in current state of given stream
 * @param  {ContentStreamReader} stream
 * @return {Token}
 */
export function match(stream) {
	// fast-path optimization: check for `<` code
	if (stream.peek() === 60 /* < */) {
		return tag(stream) || comment(stream);
	}
}

/**
 * Returns name of given matched token
 * @param  {Token} tag
 * @return {String}
 */
function getName(tag) {
	return tag.type === 'comment' ? '#comment' : tag.name.value.toLowerCase();
}
