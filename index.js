'use strict';

import StreamReader from '@emmetio/stream-reader';
import Node from './lib/node';
import tag from './lib/tag';
import comment from './lib/comment';
import cdata from './lib/cdata';
import { eatArray, toCharCodes } from './lib/utils';

export const defaultOptions = {
	/**
	 * Expect XML content in searching content. It alters how should-be-empty
	 * elements are treated: for example, in XML mode parser will try to locate
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
	empty: ['img', 'meta', 'link', 'br', 'base', 'hr', 'area', 'wbr','col', 'embed', 'input', 'param', 'source', 'track']
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
	const special = options.special.reduce(
		(map, name) => map.set(name, toCharCodes(`</${name}>`)), new Map());
	const isEmpty = (token, name) =>
		token.selfClosing || (!options.xml && empty.has(name))

	let m, node, name, stack = [root];

	while (!stream.eof()) {
		if (m = match(stream)) {
			name = getName(m);

			if (m.type === 'open') {
				// opening tag
				node = new Node(stream, 'tag', m);
				last(stack).addChild(node);
				if (special.has(name)) {
					node.close = consumeSpecial(stream, special.get(name));
				} else if (!isEmpty(m, name)) {
					stack.push(node);
				}
			} else if (m.type === 'close') {
				// closing tag, find it’s matching opening tag
				for (let i = stack.length - 1; i > 0; i--) {
					if (stack[i].name.toLowerCase() === name) {
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
 * @param  {StreamReader} stream
 * @param  {Number[]} codes
 * @return {Token}
 */
function consumeSpecial(stream, codes) {
	const start = stream.pos;
	let m;

	while (!stream.eof()) {
		if (eatArray(stream, codes)) {
			stream.pos = stream.start;
			return tag(stream);
		}
		stream.next();
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
	return tag.name ? tag.name.value.toLowerCase() : `#${tag.type}`;
}

function last(arr) {
	return arr[arr.length - 1];
}
