'use strict';

const StreamReader = require('@emmetio/stream-reader');
const benchmark = require('htmlparser-benchmark');
const Parser = require('htmlparser2').Parser;
const parse = require('./').default;

const bench1 = benchmark((html, callback) => {
	parse(html);
	callback();
});

const bench2 = benchmark((html, callback) => {
	const parser = new Parser({
		onend: callback,
		onerror: callback
	});
	parser.end(html);
});


bench1.on('result', stat => console.log('Emmet HTML parser', stat.mean().toPrecision(6) + ' ms/file ± ' + stat.sd().toPrecision(6)));
bench2.on('result', stat => console.log('htmlparser2', stat.mean().toPrecision(6) + ' ms/file ± ' + stat.sd().toPrecision(6)));
