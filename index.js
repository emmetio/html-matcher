'use strict';

import StreamReader from '@emmetio/stream-reader';
import Node from './lib/node';
import tag from './lib/tag';
import comment from './lib/comment';
import cdata from './lib/cdata';

export const defaultOptions = {
	/**
	 * Expect XML content in searching content. It alters how should-be-empty
	 * elements area treated: for example, in XML parser will try to locate
	 * closing pair for `<br>` tag
	 * @type {Boolean}
	 */
	xml: false,

	special: ['script', 'style'],

	/**
	 * List of elements that should be treated as empty (e.g. without closing tag)
	 * in non-XML syntax
	 * @type {Array}
	 */
	empty: ['img', 'meta', 'link', 'br', 'base', 'hr', 'area', 'wbr']
};

/**
 * Parses given content into a DOM-like structure
 * @param  {String|StreamReader} content
 * @param  {Object} options
 * @return {Node}
 */
export default function parse(content, options) {
	options = Object.assign({}, defaultOptions, options);
	const stream = typeof content === 'string'
		? new StreamReader(content)
		: content;

	const root = new Node(stream, 'root');
	const empty = new Set(options.empty);
	const special = new Set(options.special);
	const isEmpty = token =>
		token.selfClosing || (!options.xml && empty.has(getName(token)))
	const isSpecial = token => special.has(getName(token));

	let m, node, stack = [root];

	while (!stream.eof()) {
		if (m = match(stream)) {
			if (m.type === 'open') {
				// opening tag
				node = new Node(stream, 'tag', m);
				last(stack).addChild(node);
				if (isSpecial(m)) {
					node.close = consumeSpecial(stream, getName(m));
				} else if (!isEmpty(m)) {
					stack.push(node);
				}
			} else if (m.type === 'close') {
				// closing tag, find it’s matching opening tag
				const curName = getName(m);
				for (let i = stack.length - 1; i > 0; i--) {
					if (stack[i].name.toLowerCase() === curName) {
						stack[i].close = m;
						stack = stack.slice(0, i);
						break;
					}
				}
			} else {
				last(stack).addChild(new Node(stream, m.type, m));
			}
		} else {
			stream.next();
		}
	}

	return root;
}

/**
 * Matches known token in current state of given stream
 * @param  {ContentStreamReader} stream
 * @return {Token}
 */
export function match(stream) {
	// fast-path optimization: check for `<` code
	if (stream.peek() === 60 /* < */) {
		return comment(stream) || cdata(stream) || tag(stream);
	}
}

/**
 * Consumes stream until it finds closing tag with `name`
 * @param  {StreamReader} stream
 * @param  {String} name
 * @return {Token}
 */
function consumeSpecial(stream, name) {
	const start = stream.pos;
	let m;

	while (!stream.eof()) {
		m = tag(stream);
		if (m && m.type === 'close' && getName(m) === name) {
			return m;
		}
	}

	stream.pos = start;
	return null;
}

/**
 * Returns name of given matched token
 * @param  {Token} tag
 * @return {String}
 */
function getName(tag) {
	return tag.name.value.toLowerCase();
}

function last(arr) {
	return arr[arr.length - 1];
}
