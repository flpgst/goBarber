import { Router } from 'express'
import Multer from 'multer'
import UserController from './app/controllers/UserController'
import SessionController from './app/controllers/SessionController'
import AuthMiddleware from './app/middlewares/auth'
import MulterConfig from './config/multer'

const routes = new Router()
const upload = Multer(MulterConfig)

routes.get('/users', UserController.index)

routes.post('/users', UserController.store)
routes.post('/sessions', SessionController.store)

routes.use(AuthMiddleware)

routes.put('/users', UserController.update)

routes.post('/files', upload.single('file'), (req, res) => {
  return res.json({ ok: true })
})

export default routes
