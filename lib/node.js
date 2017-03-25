'use strict';

export default class Node {
	constructor(stream, type, open, close) {
		this.stream = stream;
		this.type = type;
		this.open = open;
		this.close = close;

		this.children = [];
		this.parent = null;
	}

	/**
	 * Returns node name
	 * @return {String}
	 */
	get name() {
		if (this.type === 'tag' && this.open) {
			return this.open && this.open.name && this.open.name.value;
		}

		return '#' + this.type;
	}

	/**
	 * Returns attributes of current node
	 * @return {Array}
	 */
	get attributes() {
		return this.open && this.open.attributes;
	}

	/**
	 * Returns node’s start position in stream
	 * @return {*}
	 */
	get start() {
		return this.open && this.open.start;
	}

	/**
	 * Returns node’s start position in stream
	 * @return {*}
	 */
	get end() {
		return this.close ? this.close.end : this.open && this.open.end;
	}

	get firstChild() {
		return this.children[0];
	}

	get nextSibling() {
		const ix = this.getIndex();
		return ix !== -1 ? this.parent.children[ix + 1] : null;
	}

	get previousSibling() {
		const ix = this.getIndex();
		return ix !== -1 ? this.parent.children[ix - 1] : null;
	}

	/**
	 * Returns current element’s index in parent list of child nodes
	 * @return {Number}
	 */
	getIndex() {
		return this.parent ? this.parent.children.indexOf(this) : -1;
	}

	/**
	 * Adds given node as a child
	 * @param {Node} node
	 * @return {Node} Current node
	 */
	addChild(node) {
		this.removeChild(node);
		this.children.push(node);
		node.parent = this;
		return this;
	}

	/**
	 * Removes given node from current node’s child list
	 * @param  {Node} node
	 * @return {Node} Current node
	 */
	removeChild(node) {
		const ix = this.children.indexOf(node);
		if (ix !== -1) {
			this.children.splice(ix, 1);
			node.parent = null;
		}

		return this;
	}
}
