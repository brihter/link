import express from 'express'
import expressAsyncHandler from 'express-async-handler'

const routerLoad = express.Router()

routerLoad.get(
  '/raw',
  expressAsyncHandler(async (req, res) => {
    const r = await req.app.load.raw()
    res.json(r)
  })
)

routerLoad.get(
  '/graph',
  expressAsyncHandler(async (req, res) => {
    const r = await req.app.load.graph()
    res.json(r)
  })
)

export { routerLoad }
