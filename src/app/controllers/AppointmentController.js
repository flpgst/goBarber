import * as Yup from 'yup'

import User from '../models/User'
import Appointment from '../models/Appointment'

class AppointmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required()
    })

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validação dos dados' })
    }

    const { provider_id, date } = req.body

    /*
      Checa se o provider_id é de um Provider
    */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true }
    })

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'Agendamentos só podem ser efetuados com Providers' })
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date
    })

    return res.json(appointment)
  }
}

export default new AppointmentController()