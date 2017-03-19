'use strict';

import tag from './lib/tag';
import comment, { backwardComment } from './lib/comment';
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
	empty: ['img', 'meta', 'link', 'br', 'base', 'hr', 'area', 'wbr']
};

/**
 * Finds tags pair (opening and closing tags) for given character `pos`
 * of content.
 * @param  {String|ContentReader|ContentStreamReader} content
 * @param  {Number}  [pos]
 * @param  {Object}  [options] Matching options (see `findPairOptions`)
 * @return {Object}
 */
export function findPair(content, pos, options) {
	if (pos && typeof pos === 'object') {
		options = pos;
		pos = null;
	}

	options = Object.assign({}, findPairOptions, options);
	const stream = createStream(content, pos);
	const start = stream.location;
	const emptyElements = new Set(options.empty);

	const inRange = (range, point) => pointInRange(stream, range, point || start);
	const isEmpty = options.xml
		? (tag, name) => tag.selfClosing
		: (tag, name) => tag.selfClosing || emptyElements.has(name);

	// Tag matching algorithm:
	// 1. Search backward for first open, unclosed element. Use stack of close/open
	//    elements to keep track of unclosed elements
	// 2. When element found and it’s not self-closing, search forward for closing
	//   element, maintaining open/close stack
	let open, close, item, name;
	const stack = [];

	item = match(stream);
	if (item && stream.compare(item.start, start) === 0) {
		// Edge case: element begins right at starting search position.
		// This is not what we’re looking for, we need its parent element
		stream.location = start;
		stream.back();
	}

	// 1. Search backward
	do {
		if (backwardComment(stream) || !(item = match(stream))) {
			continue;
		}

		// Revert stream to item start to resume backward move
		stream.location = item.start;
		name = getName(item);

		if (item.type === 'comment' && inRange(item)) {
			// Designated location is inside comment
			return item;
		} else if (item.type === 'close') {
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
				close = isEmpty(item, name) ? item : null;
				break;
			} else if (last(stack) === name) {
				stack.pop();
			} else if (!isEmpty(item, name)) {
				open = item;
				break;
			}
		}
	} while (stream.back());

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

				if (item.type === 'open' && !isEmpty(item, name)) {
					stack.push(name);
				} else if (item.type === 'close') {
					if (last(stack) === name) {
						stack.pop();
					} else {
						close = item;
						break;
					}
				}
			} else if (item = backwardComment(stream, true)) {
				// the only way this matches is that we initially started inside
				// comment
				return item;
			} else {
				stream.next();
			}
		}
	}

	// 3. Validate closing tag: remove it if it’s the same as open tag
	// (self-closing or empty tag) or if it’s name doesn’t match open tag
	// (invalid HTML)
	if (!close || open === close || getName(close) !== getName(open)) {
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

/**
 * Creates content reader stream
 * @param  {ContentReader|String} content
 * @param  {Number} [pos]  Initial stream reader position in current content pointer
 * @return {ContentStreamReader}
 */
export function createStream(content, pos) {
	if (content instanceof ContentStreamReader) {
		return content;
	}

	if (typeof content === 'string') {
		content = new ContentReader(content, pos);
	}

	return new ContentStreamReader(content, pos);
}

/**
 * Matches known token in current state of given stream
 * @param  {ContentStreamReader} stream
 * @return {Token}
 */
export function match(stream) {
	// fast-path optimization: check for `<` code
	if (stream.peek() !== 60 /* < */) {
		return null;
	}

	return tag(stream) || comment(stream);
}

/**
 * Returns name of given matched token
 * @param  {Token} tag
 * @return {String}
 */
function getName(tag) {
	return tag.type === 'comment' ? '#comment' : tag.name.value.toLowerCase();
}

function pointInRange(stream, range, point) {
	return stream.compare(range.start, point) < 0
		&& stream.compare(range.end, point) > 0;
}

function last(arr) {
	return arr[arr.length - 1];
}
