import Token from '#models/token'
import User from '#models/user'
import { forgotPasswordValidator, resetPasswordValidator } from '#validators/auth'
import stringHelpers from '@adonisjs/core/helpers/string'
import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'

export default class ResetPasswordController {
  forgotPassword({ view }: HttpContext) {
    return view.render('pages/auth/forgot_password')
  }

  async handleForgotPassword({ request, session, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const user = await User.findBy('email', email)
    if (!user || user.password === null) {
      session.flash('success', 'aucun compte associé à cet email')
      return response.redirect().toRoute('auth.login')
    }
    const token = stringHelpers.generateRandom(64)
    const url = `http://localhost:3333/reset-password?token=${token}&email=${email}`
    await Token.create({
      token,
      email: user.email,
      expiriesAt: DateTime.now().plus({ minutes: 20 }),
    })

    await mail.send((message) => {
      message
        .to(user.email)
        .from('no-reply@monblog.fr')
        .subject('reset du mot de passe')
        .htmlView('emails/forgot_password', { user, url })
    })

    session.flash('success', 'un email vient de vous être envoyé')
    return response.redirect().toRoute('auth.forgot-password')
  }

  async resetPassword({ request, session, response, view }: HttpContext) {
    const { email, token } = request.only(['token', 'email'])
    const tokenObj = await Token.findBy('token', token)
    if (
      !tokenObj ||
      !!tokenObj.isUsed === true ||
      tokenObj.email !== email ||
      DateTime.now() > tokenObj.expiriesAt
    ) {
      session.flash('error', 'Lien expiré ou invalide')
      return response.redirect().toRoute('auth.forgot-password')
    }
    return view.render('pages/auth/reset_password', { token, email })
  }

  async handleResetPassword({ request, session, response }: HttpContext) {
    const { email, password, token } = await request.validateUsing(resetPasswordValidator)
    const tokenObj = await Token.findBy('token', token)
    if (
      !tokenObj ||
      !!tokenObj.isUsed === true ||
      tokenObj.email !== email ||
      DateTime.now() > tokenObj.expiriesAt
    ) {
      session.flash('error', 'Lien expiré ou invalide')
      return response.redirect().toRoute('auth.forgot-password')
    }
    const user = await User.findBy('email', email)
    if (!user) {
      session.flash('error', 'Opération impossible')
      return response.redirect().toRoute('auth.forgot-password')
    }
    await tokenObj.merge({ isUsed: true }).save()
    await user.merge({ password }).save()
    session.flash('success', 'Le mot de passe a bien été modifié')
    return response.redirect().toRoute('auth.login')
  }
}
