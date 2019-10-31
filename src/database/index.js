import Sequelize from 'sequelize'
import Mongoose from 'mongoose'

import User from '../app/models/User'
import File from '../app/models/File'
import Appointment from '../app/models/Appointment'

import databaseConfig from '../config/database'

const models = [User, File, Appointment]

class Database {
  constructor() {
    this.init()
  }

  init() {
    this.connection = new Sequelize(databaseConfig)
    models.map(model => model.init(this.connection))
    models.map(
      model => model.associate && model.associate(this.connection.models)
    )
  }

  mongo() {
    this.mongoConnection = Mongoose.connect(
      'mongodb://localhost:27017/gobarber',
      { useNewUrlParser: true, useFindAndModify: true }
    )
  }
}

export default new Database()
