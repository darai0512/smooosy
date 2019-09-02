export {}
/*
 * initialize datadog tracing
 * https://docs.datadoghq.com/tracing/setup/nodejs/
 *
 * You must import and initialize the tracer library in an external file and
 * then import that file as a whole when building your application with a
 * transpiler. This prevents hoisting and ensures that the tracer library gets
 * imported and initialized before importing any other instrumented module.
 */
require('dd-trace').init({ logInjection: true })
