require('dotenv').config();

const { createServer } = require('http')
const { parse } = require('url')
const path = require('path')
const next = require('next')
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.NODE_ENV !== 'production' ? 'localhost' : 'localhost'
const port = process.env.PORT || 3000

// when using middleware `hostname` and `port` must be provided below

const app = next({ dev, hostname, port })

const handle = app.getRequestHandler()

app.prepare().then(() => {

  createServer(async (req, res) => {

    try {

      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.

      const parsedUrl = parse(req.url, true)

      const { pathname, query } = parsedUrl

      // Serve files from the 'uploads/' folder
      if (pathname.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), pathname); // Construct the full file path

        fs.exists(filePath, (exists) => {
          if (exists) {
            // Pipe the file from the filesystem to the response
            fs.createReadStream(filePath).pipe(res);
          } else {
            res.statusCode = 404;
            res.end('File not found');
          }
        });
        return; // Exit here as we've handled the request
      }

      if (pathname === '/a') {

        await app.render(req, res, '/a', query)

      } else if (pathname === '/b') {

        await app.render(req, res, '/b', query)

      } else {

        await handle(req, res, parsedUrl)

      }
    } catch (err) {

      console.error('Error occurred handling', req.url, err)

      res.statusCode = 500

      res.end('internal server error')

    }
  })
    .once('error', (err) => {

      console.error(err)

      process.exit(1)

    })
    .listen(port, () => {

      console.log(`> Ready on http://${hostname}:${port} environment: ${process.env.NODE_ENV}`)

    })
})
