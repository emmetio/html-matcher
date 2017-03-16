'use strict';

import tag from './lib/tag';
import comment from './lib/comment';
import ContentStreamReader from './lib/content-stream-reader';

export default function parse(content) {
	const stream = new ContentStreamReader(content);
	const stats = {
		open: 0,
		close: 0,
		comment: 0
	};

	let item;

	while (!stream.eof()) {
		if (item = comment(stream)) {
			stats.comment++
		} else if (item = tag(stream)) {
			stats[item.type]++;
		} else {
			stream.next();
		}
	}

	return stats;
}
