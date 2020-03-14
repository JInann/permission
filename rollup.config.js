import json from'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import typescript from 'rollup-plugin-typescript2'
export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/index.js',
        format: 'cjs'
    },
    plugins:[
        json(),
        typescript(),
        babel({
            exclude: 'node_modules/**',
            plugins: ['external-helpers']
        }),
    ]
};
