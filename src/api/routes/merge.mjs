import express from 'express'
import expressAsyncHandler from 'express-async-handler'

const routerMerge = express.Router()

routerMerge.get(
  '/raw',
  expressAsyncHandler(async (req, res) => {
    const r = await req.app.merge.raw()
    res.json(r)
  })
)

export { routerMerge }
