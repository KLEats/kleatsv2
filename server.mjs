// Custom Next.js server to run frontend on HTTP :3001 (localhost) behind a reverse proxy (Caddy)
// Reverse proxy will handle TLS + HTTP/2 + HTTP/3 and proxy to this server.

import http from 'http'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '127.0.0.1'
const port = Number(process.env.FRONTEND_PORT || 3001)

// Create Next app (do not bind a port; we'll attach the handler to our servers)
const app = next({ dev, hostname })
const handle = app.getRequestHandler()

// Cashfree webhook reverse-proxy settings
// Incoming (frontend HTTPS):   POST https://<FRONTEND>/cashfree/webhook
// Forward to backend (origin): POST http://<BACKEND_HOST>:<PORT>/cashfree/webhook
const CASHFREE_WEBHOOK_PATH = process.env.CASHFREE_WEBHOOK_PATH || '/cashfree/webhook'
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || process.env.API_BASE_URL || 'http://127.0.0.1:3000'
const ENABLE_SERVER_WEBHOOK_PROXY = String(process.env.ENABLE_SERVER_WEBHOOK_PROXY || '').toLowerCase() === 'true'

// Start server
app.prepare().then(() => {
	const httpServer = http.createServer((req, res) => {
		// Reverse-proxy Cashfree webhook as a raw byte stream before Next handles anything
		try {
			const method = req.method || 'GET'
			const url = req.url || '/'
			const pathname = url.split('?')[0]
			if (ENABLE_SERVER_WEBHOOK_PROXY && method === 'POST' && pathname === CASHFREE_WEBHOOK_PATH) {
				// Parse backend origin
				let target
				try { target = new URL(BACKEND_ORIGIN) } catch (e) {
					console.error('[Webhook] Invalid BACKEND_ORIGIN:', BACKEND_ORIGIN)
					res.statusCode = 500
					res.end('Invalid backend origin')
					return
				}
				const backendProtocol = target.protocol === 'https:' ? require('https') : http
				const query = url.includes('?') ? `?${url.split('?')[1]}` : ''
				const options = {
					protocol: target.protocol,
					hostname: target.hostname,
					port: target.port || (target.protocol === 'https:' ? 443 : 80),
					method: 'POST',
					path: CASHFREE_WEBHOOK_PATH + query,
					headers: {
						// Preserve all incoming headers, especially signatures and content-type/length
						...req.headers,
						// Set Host to backend host to avoid upstream virtual-host issues
						host: target.host,
					},
				}
				const proxyReq = backendProtocol.request(options, (proxyRes) => {
					// Mirror status and headers back to client
					res.writeHead(proxyRes.statusCode || 500, proxyRes.headers)
					proxyRes.pipe(res)
				})
				proxyReq.on('error', (err) => {
					console.error('[Webhook] Proxy error:', err?.message || err)
					if (!res.headersSent) res.writeHead(502)
					res.end('Bad gateway')
				})
				// Stream raw bytes from the client to backend; no buffering, no parsing
				req.pipe(proxyReq)
				return // do not hand off to Next
			}
		} catch (e) {
			console.error('[HTTP] Handler error:', e)
		}

		// Hand off all other requests to Next
		handle(req, res)
	})

	httpServer.listen(port, hostname, () => {
		console.log(`[HTTP] Next.js app listening on ${hostname}:${port}`)
	})
}).catch((err) => {
	console.error('Failed to prepare Next app:', err)
	process.exit(1)
})

