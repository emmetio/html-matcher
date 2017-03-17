'use strict';

import tag from './lib/tag';
import comment from './lib/comment';
import ContentReader from './lib/content-reader';
import ContentStreamReader from './lib/content-stream-reader';

export default function parse(content) {
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
		} else if (item = tag(stream)) {
			stats[item.type]++;
		} else {
			stream.next();
		}
	}

	return stats;
}
