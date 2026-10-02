import type { Ctx } from '../ctx.ts'
import { lines } from '../lines.ts'

export function rolesFile(ctx: Ctx) {
  return lines(
    ctx.ff && `import { FF_Role } from 'firstly'`,
    ctx.ff && `import { Roles_ChangeLog } from 'firstly/changeLog'`,
    ctx.ff && ctx.internal && `import { Roles_Cron } from 'firstly/cron'`,
    ctx.ff && ctx.internal && `import { Roles_Mail } from 'firstly/mail'`,
    ctx.ff && ctx.internal && `import { Roles_SqlAdmin } from 'firstly/sqlAdmin'`,
    ctx.ff && ``,
    `/** Every role of the app, in one place. Modules bring their own. */`,
    `export const Roles = {`,
    `  admin: 'admin',`,
    ctx.ff && `  ...FF_Role,`,
    ctx.ff && `  ...Roles_ChangeLog,`,
    ctx.ff && ctx.internal && `  ...Roles_Cron,`,
    ctx.ff && ctx.internal && `  ...Roles_Mail,`,
    ctx.ff && ctx.internal && `  ...Roles_SqlAdmin,`,
    `} as const`,
    ``,
    `/** An app admin holds every role, module roles included. */`,
    `export const ADMIN_ROLES = Object.values(Roles)`,
    ``,
  )
}

/** `import { ... } from 'remult'`, sorted, without the unused ones. */
function remultImport(...names: Array<string | false>) {
  const list = names.filter((n): n is string => Boolean(n)).sort()
  return `import { ${list.join(', ')} } from 'remult'`
}

export function taskFile(ctx: Ctx) {
  const entity = ctx.ff ? 'FF_Entity' : 'Entity'
  return lines(
    remultImport('Fields', 'Validators', ctx.auth && 'Allow', ctx.auth && 'remult', !ctx.ff && 'Entity'),
    ctx.ff && `import { FF_Entity } from 'firstly'`,
    ``,
    `import { Roles } from '${ctx.lib}/roles.ts'`,
    ``,
    `export const PRIORITIES = ['low', 'normal', 'high'] as const`,
    `export type Priority = (typeof PRIORITIES)[number]`,
    ``,
    ctx.ff && `// FF_Entity = @Entity + changeLog wiring (see /internal/changes).`,
    `@${entity}<Task>('tasks', {`,
    `  allowApiRead: true,`,
    ctx.auth ? `  allowApiInsert: Allow.authenticated,` : `  allowApiInsert: true,`,
    ctx.auth ? `  allowApiUpdate: Allow.authenticated,` : `  allowApiUpdate: true,`,
    ctx.auth ? `  allowApiDelete: Roles.admin,` : `  allowApiDelete: true,`,
    `  defaultOrderBy: { completed: 'asc', createdAt: 'desc' },`,
    `})`,
    `export class Task {`,
    `  @Fields.id()`,
    `  id!: string`,
    ``,
    `  @Fields.string<Task>({`,
    `    validate: [Validators.required, (t) => t.title.length > 2 || 'Too short (3 chars min)'],`,
    `  })`,
    `  title = ''`,
    ``,
    `  @Fields.boolean()`,
    `  completed = false`,
    ``,
    `  @Fields.literal(() => PRIORITIES)`,
    `  priority: Priority = 'normal'`,
    ``,
    ctx.auth && `  @Fields.string({ allowApiUpdate: false, defaultValue: () => remultUserId() })`,
    ctx.auth && `  ownerId = ''`,
    ctx.auth && ``,
    `  @Fields.createdAt()`,
    `  createdAt?: Date`,
    `}`,
    ctx.auth && ``,
    ctx.auth && `function remultUserId() {`,
    ctx.auth && `  return remult.user?.id ?? ''`,
    ctx.auth && `}`,
    ``,
  )
}

export function userFile(ctx: Ctx) {
  const entity = ctx.ff ? 'FF_Entity' : 'Entity'
  return lines(
    remultImport('Allow', 'Fields', 'Validators', !ctx.ff && 'Entity'),
    ctx.ff && `import { FF_Entity } from 'firstly'`,
    ``,
    `import { Roles } from '${ctx.lib}/roles.ts'`,
    ``,
    `@${entity}<User>('users', {`,
    `  allowApiRead: Allow.authenticated,`,
    `  allowApiCrud: Roles.admin,`,
    `  defaultOrderBy: { name: 'asc' },`,
    `})`,
    `export class User {`,
    `  @Fields.id()`,
    `  id!: string`,
    ``,
    `  @Fields.string<User>({ validate: [Validators.required, Validators.unique] })`,
    `  email = ''`,
    ``,
    `  @Fields.string<User>({ validate: Validators.required })`,
    `  name = ''`,
    ``,
    `  @Fields.json<User, string[]>({ allowApiUpdate: Roles.admin })`,
    `  roles: string[] = []`,
    ``,
    `  /** Set when the email was proven. Only enforced if REQUIRE_EMAIL_VERIFICATION is on. */`,
    `  @Fields.date({ allowNull: true, allowApiUpdate: false })`,
    `  verifiedAt: Date | null = null`,
    ``,
    `  @Fields.createdAt()`,
    `  createdAt?: Date`,
    `}`,
    ``,
  )
}

export function entitiesIndexFile(ctx: Ctx) {
  return lines(
    `import type { ClassType } from 'remult'`,
    ``,
    `import { Task } from '${ctx.mod}/task/Task.ts'`,
    ctx.auth && `import { User } from '${ctx.mod}/auth/User.ts'`,
    ``,
    `/** Single source of truth: the API, the Admin UI and the seed all read this. */`,
    `export const entities: ClassType<unknown>[] = [Task${ctx.auth ? ', User' : ''}]`,
    ``,
  )
}
