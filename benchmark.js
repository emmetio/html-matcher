'use strict';

const StreamReader = require('@emmetio/stream-reader');
const benchmark = require('htmlparser-benchmark');
const htmlparser2 = require('htmlparser2');
const parse = require('./').default;

const bench1 = benchmark((html, callback) => {
	parse(html);
	callback();
});

const bench2 = benchmark((html, callback) => {
	htmlparser2.parseDOM(html, {
		onerror: callback
	});
	callback();
});


bench1.on('result', stat => console.log('Emmet HTML parser', stat.mean().toPrecision(6) + ' ms/file ± ' + stat.sd().toPrecision(6)));
bench2.on('result', stat => console.log('htmlparser2', stat.mean().toPrecision(6) + ' ms/file ± ' + stat.sd().toPrecision(6)));
