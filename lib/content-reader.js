'use strict';

/**
 * Abstract content stream reader implementation.
 * The HTML matcher requires text content only to operate, but getting a full
 * text content from text editor might be very resource-consuming operation,
 * especially on large files.
 *
 * The content stream reader provides unified interface for reading file content
 * by chunks (by lines, mosly). This reader should be created with `.cursor`
 * property that points to current text chunk and `.get(cursor)` method that
 * should provide chunk content for given cursor.
 *
 * It also must provide `.next(custor)` and `.prev(cursor)` methods
 * that will return next and previous cursors accodingly of `null` if given
 * cursor is at the end of file.
 *
 * This concrete implementation is a shim for extracting content from given
 * text and doesn’t provide streaming at all
 */
export default class ContentReader {
	constructor(text) {
		this.cursor = 0;
		this.text = text;
	}

	get(cursor) {
		return this.text;
	}

	next(cursor) {
		return null;
	}

	prev(cursor) {
		return null;
	}
}
