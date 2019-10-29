import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { Op } from 'sequelize'
import Appointment from '../models/Appointment'
import User from '../models/User'

class ScheduleControler {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true }
    })
    console.log(checkUserProvider)
    if (!checkUserProvider) {
      return res
        .status(400)
        .json({ error: 'Usuário logado não é prestador de serviço' })
    }

    const { date } = req.query
    const parsedDate = parseISO(date)

    const appointments = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)]
        }
      },
      order: ['date']
    })

    return res.json(appointments)
  }
}

export default new ScheduleControler()
