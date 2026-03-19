import express from 'express'
import expressAsyncHandler from 'express-async-handler'

const routerState = express.Router()

routerState.get(
  '/load',
  expressAsyncHandler(async (req, res) => {
    const r = await req.app.state.load()
    res.json(r)
  })
)

routerState.get(
  '/remove/:id',
  expressAsyncHandler(async (req, res) => {
    await req.app.state.remove(req.params.id)
    const r = await req.app.state.load()
    res.json(r)
  })
)

routerState.post(
  '/save',
  expressAsyncHandler(async (req, res) => {
    const params = req.body || {}
    await req.app.state.save(params)
    const r = await req.app.state.load()
    res.json(r)
  })
)

export { routerState }
