import { Router } from 'express'
import Multer from 'multer'

import UserController from './app/controllers/UserController'
import SessionController from './app/controllers/SessionController'
import FileController from './app/controllers/FileController'
import ProviderController from './app/controllers/ProviderController'
import AppointmentController from './app/controllers/AppointmentController'
import ScheduleController from './app/controllers/ScheduleController'
import NotificationController from './app/controllers/NotificationController'

import AuthMiddleware from './app/middlewares/auth'
import MulterConfig from './config/multer'

const routes = new Router()
const upload = Multer(MulterConfig)

routes.get('/users', UserController.index)

routes.post('/users', UserController.store)
routes.post('/sessions', SessionController.store)

routes.use(AuthMiddleware)

routes.put('/users', UserController.update)

routes.get('/providers', ProviderController.index)

routes.post('/files', upload.single('file'), FileController.store)

routes.post('/appointments', AppointmentController.store)
routes.get('/appointments', AppointmentController.index)

routes.get('/schedule', ScheduleController.index)

routes.get('/notifications', NotificationController.index)
routes.put('/notifications/:id', NotificationController.update)

export default routes
