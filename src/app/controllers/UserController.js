import * as Yup from 'yup'
import User from '../models/User'

class UserController {
  async index(req, res) {
    const { email } = req.body

    const user = email ? await User.findOne({ where: { email } }) : null

    if (!user) return res.status(401).json('Usuário não existe')
    return res.json(user)
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6)
    })

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Falha na validação dos dados' })
    }

    const userExists = await User.findOne({ where: { email: req.body.email } })

    if (userExists) return res.status(400).json({ error: 'Usuário já existe' })

    const { id, name, email, provider } = await User.create(req.body)
    return res.json({
      id,
      name,
      email,
      provider
    })
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string()
        .min(6)
        .when('password', (password, field) =>
          password ? field.required() : field
        ),
      password: Yup.string().min(6),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      )
    })

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'Falha na validação dos dados no update' })
    }

    const { email, oldPassword, password } = req.body

    const user = await User.findByPk(req.userId)

    if (email && email !== user.email) {
      const userExists = await User.findOne({ where: { email } })

      if (userExists)
        return res
          .status(400)
          .json({ error: 'Este e-mail já está em uso por outro usuário' })
    }

    if (oldPassword && !(await user.checkPassword(oldPassword)))
      return res.status(401).json({ error: 'Senha inválida' })

    if (password && !oldPassword) {
      return res.status(401).json({ error: 'Senha antiga não informada' })
    }
    const { id, name, provider } = await user.update(req.body)

    return res.json({
      id,
      name,
      email,
      provider
    })
  }
}

export default new UserController()
