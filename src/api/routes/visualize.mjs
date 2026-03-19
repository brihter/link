import { v4 as uuid } from 'uuid'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import expressAsyncHandler from 'express-async-handler'

const __dirname = dirname(fileURLToPath(import.meta.url))
const routerVisualize = express.Router()

routerVisualize.get(
  '/:reportName.dot',
  expressAsyncHandler(async (req, res) => {
    const params = JSON.parse(req.query.filter)
    params.format = 'dot'

    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    })

    res.send(response.content)
  })
)

routerVisualize.get(
  '/:reportName.svg',
  expressAsyncHandler(async (req, res) => {
    const params = JSON.parse(req.query.filter)
    params.format = 'svg'

    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    })

    res.sendFile(response.content, {
      root: `${__dirname}/../../../`
    })
  })
)

routerVisualize.get(
  '/:reportName.:format/download',
  expressAsyncHandler(async (req, res) => {
    const params = JSON.parse(req.query.filter)
    params.format = req.params.format

    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    })

    res.download(
      `${__dirname}/../../../${response.content}`,
      `${uuid()}.${params.format}`
    )
  })
)

routerVisualize.post(
  '/:reportName',
  expressAsyncHandler(async (req, res) => {
    const params = req.body || {}
    params.format = 'svg'

    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    })

    res.sendFile(response.content, {
      root: `${__dirname}/../../../`
    })
  })
)

routerVisualize.post(
  '/:reportName/stats',
  expressAsyncHandler(async (req, res) => {
    const params = req.body || {}
    params.format = 'svg'

    const response = await req.app.visualize({
      name: req.params.reportName,
      params
    })

    res.json(response.stats)
  })
)

export { routerVisualize }
