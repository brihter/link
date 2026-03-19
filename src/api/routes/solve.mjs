import express from 'express'
import expressAsyncHandler from 'express-async-handler'

const routerSolve = express.Router()

routerSolve.get(
  '/',
  expressAsyncHandler(async (req, res) => {
    const r = await req.app.solve()
    res.json(r)
  })
)

export { routerSolve }
