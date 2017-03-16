export default {
	entry: './index.js',
	targets: [
		{format: 'cjs', dest: 'dist/html-matcher.cjs.js'},
		{format: 'es',  dest: 'dist/html-matcher.es.js'}
	]
};
