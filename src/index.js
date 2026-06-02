'use strict'

const Fastify = require('fastify')
const promClient = require('prom-client')

promClient.collectDefaultMetrics()

const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
})

const app = Fastify({ logger: true })

app.addHook('onResponse', (req, reply, done) => {
  httpDuration
    .labels(req.method, req.routeOptions?.url ?? req.url, reply.statusCode)
    .observe(reply.elapsedTime / 1000)
  done()
})

app.get('/health', async () => ({ status: 'ok', service: 'teste8' }))

app.get('/metrics', async (req, reply) => {
  reply.header('Content-Type', promClient.register.contentType)
  return promClient.register.metrics()
})

// TODO: adicionar rotas aqui

const start = async () => {
  await app.listen({ port: parseInt(process.env.PORT ?? '3000'), host: '0.0.0.0' })
}

start().catch(err => {
  app.log.error(err)
  process.exit(1)
})
