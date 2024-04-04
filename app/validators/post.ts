import vine from '@vinejs/vine'

export const storePostValidator = vine.compile(
  vine.object({
    title: vine.string().unique(async (db, value) => {
      const posts = await db.from('posts').where('title', value).first()
      return !posts // Retourne true si aucun post existant n'a été trouvé
    }),

    thumbnail: vine.file({ extnames: ['jpg', 'png'], size: '10mb' }).optional(),
    content: vine.string(),
  })
)
