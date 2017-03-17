'use strict';

import tag from './lib/tag';
import comment from './lib/comment';
import ContentReader from './lib/content-reader';
import ContentStreamReader from './lib/content-stream-reader';

export const findPairOptions = {
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
	empty: ['img', 'meta', 'link', 'br', 'area'],

	/**
	 * Exclude comments from match result
	 * @type {Boolean}
	 */
	excludeComments: false
};

/**
 * Finds tags pair (opening and closing tags) for given character `pos`
 * of content.
 * @param  {ContentReader|String} content
 * @param  {Number}  pos
 * @param  {Object}  options Matching options (see `findPairOptions`)
 * @return {Object}
 */
export function findPair(content, pos, options) {
	if (typeof content === 'string') {
		content = new ContentReader(content, pos);
	}

	options = Object.assign({}, findPairOptions, options);
	const stream = new ContentStreamReader(content, pos);
	const start = stream.location;
	const inRange = (range, point) => pointInRange(stream, range, point || start);
	const isEmpty = token => options.empty.includes( getName(token) );
	const getName = token => typeof token === 'object'
		? token.name && token.name.value.toLowerCase()
		: token;

	// Tag matching algorithm:
	// 1. Search backward for first open, unclosed element. Use start of close/open
	//    elements to keep track of unclosed elements
	// 2. When element found and it’s not self-closing, search forward for closing
	//   element, maintaining open/close stack
	let open, close, item, name;
	const stack = [];

	// 1. Search backward
	while (true) {
		if (item = match(stream)) {
			if (item.type === 'comment' && inRange(item) && !options.excludeComments) {
				// Designated location is inside comment
				return item;
			}

			name = getName(item);

			// console.log('found', name, item.type, item.selfClosing);

			if (item.type === 'close') {
				if (inRange(item)) {
					// Designated location is in closing tag: we should find opening
					// match for it
					close = item;
				} else {
					// Closing tag is on the way to required opening tag
					stack.push(name);
				}
			} else if (item.type === 'open') {
				if (inRange(item)) {
					// Could be an opening tag and should find its closing part,
					// or an empty, void element and we should stop searching
					open = item;
					if (item.selfClosing || (!options.xml && isEmpty(name))) {
						close = item;
					}
					break;
				} else if (last(stack) === name) {
					stack.pop();
				} else if (!item.selfClosing && (options.xml || !isEmpty(name))) {
					open = item;
					break;
				}
			}

			// Revert stream to item start
			stream.location = item.start;
		}

		if (stream.sof()) {
			break;
		} else {
			stream.backUp();
		}
	}

	if (!open) {
		return null;
	}

	if (!close) {
		// 2. Search forward for closing tag
		stack.length = 0;
		stream.location = stream.compare(open.end, start) > 0 ? open.end : start;

		while (!stream.eof()) {
			if (item = match(stream)) {
				name = getName(item);
				if (item.type === 'open' && (options.xml || !isEmpty(name))) {
					stack.push(getName(item));
				} else if (item.type === 'close') {
					if (last(stack) === name) {
						stack.pop();
					} else {
						close = item;
						break;
					}
				}
			}

			stream.next();
		}
	}

	// 3. Validate closing tag
	if (close && (open === close || getName(close) !== getName(open))) {
		close = null;
	}

	return {
		open,
		close,
		type: 'tag',
		start: open.start,
		end: close ? close.end : open.end
	};
}

export function parse(content) {
	const stream = new ContentStreamReader(new ContentReader(content));
	const stats = {
		open: 0,
		close: 0,
		comment: 0
	};

	let item;

	while (!stream.eof()) {
		if (item = comment(stream)) {
			stats.comment++;
			stream.location = item.end;
		} else if (item = tag(stream)) {
			stats[item.type]++;
			stream.location = item.end;
		} else {
			stream.next();
		}
	}

	return stats;
}

function match(stream) {
	return tag(stream) || comment(stream);
}

function pointInRange(stream, range, point) {
	return stream.compare(range.start, point) < 0
		&& stream.compare(range.end, point) > 0;
}

function last(arr) {
	return arr[arr.length - 1];
}
