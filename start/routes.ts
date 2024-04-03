/* eslint-disable @adonisjs/prefer-lazy-controller-import */
/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import AuthController from '#controllers/auth_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import ResetPasswordController from '#controllers/reset_password_controller'
import PostController from '#controllers/post_controller'

router.on('/').render('pages/home').as('home')

router.get('/register', [AuthController, 'register']).as('auth.register').use(middleware.guest())
router.post('/register', [AuthController, 'handleRegsiter']).use(middleware.guest())
router.get('/login', [AuthController, 'login']).as('auth.login').use(middleware.guest())
router.post('/login', [AuthController, 'handleLogin']).use(middleware.guest())

router
  .get('/forgot-password', [ResetPasswordController, 'forgotPassword'])
  .as('auth.forgot-password')
  .use(middleware.guest())

router
  .post('/forgot-password', [ResetPasswordController, 'handleForgotPassword'])
  .use(middleware.guest())

router
  .get('/reset-password', [ResetPasswordController, 'resetPassword'])
  .as('auth.reset-password')
  .use(middleware.guest())

router
  .post('/reset-password', [ResetPasswordController, 'handleResetPassword'])
  .as('auth.handleReset-password')
  .use(middleware.guest())

router.delete('/login', [AuthController, 'logout']).as('auth.logout').use(middleware.auth())

router.get('/post/create', [PostController, 'create']).as('post.create').use(middleware.auth())
