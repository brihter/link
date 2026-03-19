import express from 'express'
import expressAsyncHandler from 'express-async-handler'

const routerAnalyze = express.Router()

routerAnalyze.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const r = await req.app.analyze()
    res.json(r)
  })
)

export { routerAnalyze }
