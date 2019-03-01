# express-history-api-fallback
A tiny, accurate, fast Express middleware for single page apps with client side routing.

[![Build Status](https://travis-ci.org/cbas/express-history-api-fallback.svg?branch=master)](https://travis-ci.org/cbas/express-history-api-fallback)
[![codecov.io](https://codecov.io/github/cbas/express-history-api-fallback/coverage.svg?branch=master)](https://codecov.io/github/cbas/express-history-api-fallback?branch=master)

[![NPM](https://nodei.co/npm/express-history-api-fallback.png)](https://www.npmjs.com/package/express-history-api-fallback)

Works as a middleware for Express. Can be used as either an application middleware or a router middleware.

```js
import fallback from 'express-history-api-fallback'
import express from 'express'
const app = express()
const root = `${__dirname}/public`
app.use(express.static(root))
app.use(fallback('index.html', { root }))
```
Or in ECMAScript 5:
```js
var fallback = require('express-history-api-fallback')
var express = require('express')
var app = express()
var root = __dirname + '/public'
app.use(express.static(root))
app.use(fallback('index.html', { root: root }))
```

## fallback(path[, options])
Returns a middleware for use by Express applications and routers.

Arguments are passed to [res.sendFile()](http://expressjs.com/api.html#res.sendFile) in `express@>=v4.8.0`, or [res.sendfile()](http://expressjs.com/en/3x/api.html#res.sendfile) otherwise.

Absolute path:
```js
app.use(fallback(__dirname + '/dist/app.html'))
```
Relative path:
```js
app.use(fallback('dist/app.html', { root: __dirname }))
```

### path
Location of the HTML file containing single page app entry point.

Unless the `root` option is set in the `options` object, `path` must be an absolute path of the file.

### options
Valid options are `maxAge`, `root`, `lastModified`, `headers`, and `dotfiles`. See [Response.sendFile()](http://expressjs.com/api.html#res.sendFile) for details. Note that only `maxAge` and `root` are supported with `express@<4.8`.

## But doesn't this already exist?
Yes, but this implementation is much better.

- **Only for GET (and HEAD) requests**: The fallback should not serve your `index.html` for `POST` or other requests.
- **Only for HTML requests**: Never serve mistakenly for JS or CSS or image or other static file requests. Less debugging headaches.
- **Only when needed**: Serve the fallback only when the file is missing.
- **High performance**: Let `res.sendFile()` in Express `>=4.8.0` do the heavy lifting of serving the file.
- **Minimal code**: Just a few lines. No magic. No complexity.

See the blog post ["Single Page App Routing with Express & Node.js"](https://ninja.sg/spa-router-fallback/) for an overview of the problems with alternative middlewares.
