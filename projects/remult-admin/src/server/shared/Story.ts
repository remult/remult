import { Entity, Fields, getEntityRef, remult } from '../../../../core/index.js'

@Entity<Story>('stories', {
  apiPrefilter: () => {
    if (remult.isAllowed('admin')) return {}
    return { ownerId: remult.user?.id }
  },
})
export class Story {
  @Fields.id()
  id!: string

  @Fields.string<Story>({
    // Only settable on creation
    // This has an issue
    // allowApiUpdate: (story) => getEntityRef(story).isNew(),
    allowApiUpdate: (story) => (story ? getEntityRef(story).isNew() : true),
  })
  ownerId = remult.user?.id
}
