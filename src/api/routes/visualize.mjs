import { v4 as uuid } from 'uuid'
import express from 'express'
import expressAsyncHandler from 'express-async-handler'

const routerVisualize = express.Router()

const visualizationRequest = handler => expressAsyncHandler(async (req, res) => {
  const controller = new AbortController()
  const onClose = () => {
    if (!res.writableFinished) controller.abort()
  }
  res.once('close', onClose)
  if (res.destroyed) onClose()
  try {
    controller.signal.throwIfAborted()
    await handler(req, res, controller.signal)
  } catch (error) {
    if (!controller.signal.aborted || error?.name !== 'AbortError') throw error
  } finally {
    res.removeListener('close', onClose)
  }
})

routerVisualize.get(
  '/:reportName.dot',
  visualizationRequest(async (req, res, signal) => {
    const params = JSON.parse(req.query.filter)
    params.format = 'dot'
    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    }, { signal })
    res.send(response.content)
  })
)

routerVisualize.get(
  '/:reportName.svg',
  visualizationRequest(async (req, res, signal) => {
    const params = JSON.parse(req.query.filter)
    params.format = 'svg'
    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    }, { signal })
    res.sendFile(response.content)
  })
)

routerVisualize.get(
  '/:reportName.:format/download',
  visualizationRequest(async (req, res, signal) => {
    const params = JSON.parse(req.query.filter)
    params.format = req.params.format
    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    }, { signal })
    if (params.format === 'csv') {
      res.attachment(`${uuid()}.csv`)
      res.send(response.content)
      return
    }
  
    res.download(response.content, `${uuid()}.${params.format}`)
  })
)

routerVisualize.post(
  '/table/data',
  visualizationRequest(async (req, res, signal) => {
    const params = req.body || {}
    params.format = 'json'
    const response = await req.app.visualize({
      name: 'table',
      params
    }, { signal })
    res.json(response)
  })
)

routerVisualize.post(
  '/:reportName',
  visualizationRequest(async (req, res, signal) => {
    const params = req.body || {}
    params.format = 'svg'
    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    }, { signal })
    res.sendFile(response.content)
  })
)

routerVisualize.post(
  '/:reportName/stats',
  visualizationRequest(async (req, res, signal) => {
    const params = req.body || {}
    params.format = 'stats'
    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    }, { signal })
    res.json(response.stats)
  })
)

export { routerVisualize }
