import express from 'express'
import expressAsyncHandler from 'express-async-handler'

const routerExport = express.Router()

routerExport.get(
  '/graph',
  expressAsyncHandler(async (req, res) => {
    const r = await req.app.export.graph()
    res.json(r)
  })
)

export { routerExport }
