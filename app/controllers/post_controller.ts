import Post from '#models/post'
import FileUploaderService from '#services/file_uploader_service'
import { storePostValidator } from '#validators/post'
import { inject } from '@adonisjs/core'
import stringHelpers from '@adonisjs/core/helpers/string'
import type { HttpContext } from '@adonisjs/core/http'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

@inject()
export default class PostController {
  /**
   * Display a list of resource
   */
  constructor(private readonly fileUploaderService: FileUploaderService) {}
  async index({ view, request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 2
    const posts = await Post.query()
      .select('id', 'title', 'thumbnail', 'slug', 'user_id')
      .preload('user', (u) => u.select('username'))
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
    return view.render('pages/home', { posts })
  }

  /**
   * Display form to create a new record
   */
  async create({ view }: HttpContext) {
    return view.render('pages/post/create')
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, auth, session, response }: HttpContext) {
    const { content, thumbnail, title } = await request.validateUsing(storePostValidator)
    const slug = stringHelpers.slug(title).toLocaleLowerCase()
    const filePath = await this.fileUploaderService.upload(thumbnail, slug, 'posts')
    await Post.create({
      content,
      slug,
      thumbnail: filePath,
      title,
      userId: auth.user!.id,
    })
    session.flash('success', 'votre article à bien été publié')
    return response.redirect().toRoute('home')
  }

  /**
   * Show individual record
   */
  async show({ params, response, view }: HttpContext) {
    const { slug, id } = params
    const post = await Post.findByOrFail('id', id)
    // await post.load('user')
    const marked = new Marked(
      markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang, info) {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext'
          return hljs.highlight(code, { language }).value
        },
      })
    )
    const content = marked.parse(post.content)
    if (post.slug !== slug) {
      return response.redirect().toRoute('post.show', { slug: post.slug, id })
    }
    return view.render('pages/post/show', { content, postTitle: post.title })
  }

  /**
   * Edit individual record
   */
  async edit({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request }: HttpContext) {}

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) {}
}
