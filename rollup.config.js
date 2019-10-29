import typescript from 'rollup-plugin-typescript2';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    input: './src/index.ts',
    external: ['@emmetio/scanner'],
    plugins: [nodeResolve(), typescript({
        tsconfigOverride: {
            compilerOptions: { module: 'esnext' }
        }
    })],
    output: [{
        file: './dist/html-matcher.es.js',
        format: 'es',
        sourcemap: true
    }, {
        file: './dist/html-matcher.cjs.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
    }]
};
