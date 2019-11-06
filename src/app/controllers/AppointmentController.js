import * as Yup from 'yup'
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns'
import pt from 'date-fns/locale/pt'

import User from '../models/User'
import Appointment from '../models/Appointment'
import File from '../models/File'
import Notification from '../schemas/Notification'
import Queue from '../../lib/Queue'
import CancellationMail from '../jobs/CancellationMail'

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query

    const appointments = await Appointment.finddAll({
      where: {
        user_id: req.userId,
        canceled_at: null
      },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url']
          }
        }
      ]
    })
    return res.json(appointments)
  }

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

    if (req.userId === parseInt(provider_id, 10)) {
      return res.status(401).json({
        error: 'Agendamentos não podem ser efetuados para o usuário logado'
      })
    }

    const hourStart = startOfHour(parseISO(date))

    if (isBefore(hourStart, new Date())) {
      return res
        .status(400)
        .json({ error: 'Datas passadas não são permitidas' })
    }

    const checkAvalability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart
      }
    })

    if (checkAvalability) {
      return res.status(400).json({ error: 'Data não disponível' })
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart
    })

    /**
     * Notifica o prestador de serviço sobre novo agendamento
     */

    const user = await User.findByPk(req.userId)
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    )

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id
    })

    return res.json(appointment)
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['name']
        }
      ]
    })

    if (!appointment)
      return res.status(401).json({ error: 'Agendamento inexistente' })

    if (appointment.user_id !== req.userId) {
      return res
        .status(401)
        .json({ error: 'Acesso negado para cancelar este agendamento' })
    }

    const minDate = subHours(parseISO(appointment.date), 2)

    if (isBefore(minDate, new Date())) {
      return res.status(401).json({
        error: 'Você só pode cancelar agendamentos com 2 horas de antecedência'
      })
    }

    appointment.canceled_at = new Date()

    await appointment.save()

    await Queue.add(CancellationMail.key, {
      appointment
    })

    return res.json(appointment)
  }
}

export default new AppointmentController()
