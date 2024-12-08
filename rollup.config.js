import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
    input: './src/index.ts',
    external: ['@emmetio/scanner'],
    plugins: [nodeResolve(), typescript()],
    output: [{
        file: './dist/html-matcher.js',
        format: 'es',
        sourcemap: true
    }, {
        file: './dist/html-matcher.cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
    }]
};
