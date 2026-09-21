import express from 'express'

const routerCubes = express.Router()

routerCubes.get('/', (req, res) => {
  res.json(req.app.cubes.list())
})

export { routerCubes }
