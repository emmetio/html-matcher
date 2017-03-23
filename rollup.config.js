export default {
	entry: './index.js',
	external: [
		'@emmetio/stream-reader',
		'@emmetio/stream-reader-utils'
	],
	exports: 'named',
	targets: [
		{format: 'cjs', dest: 'dist/html-matcher.cjs.js'},
		{format: 'es',  dest: 'dist/html-matcher.es.js'}
	]
};
