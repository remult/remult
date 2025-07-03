import { Allow, Entity, Fields, Relations, remult, Validators } from "remult";

export const Role_Auth = {
  Auth__Admin: "auth__admin",
  // Auth__Read_Stuff: "auth__read_stuff",
} as const;

@Entity<User>("user", {
  allowApiCrud: Role_Auth.Auth__Admin,
  allowApiRead: Allow.authenticated,
  allowApiUpdate: (item) => {
    return item?.id === remult.user?.id;
  },
  apiPrefilter: () => {
    if (!remult.user?.id) {
      throw new Error("User not authenticated");
    }
    return { id: remult.user?.id };
  },
})
export class User {
  @Fields.string({
    required: true,
    minLength: 8,
    maxLength: 40,
    validate: Validators.unique(),
    allowApiUpdate: false,
  })
  id!: string;

  @Fields.string({ required: true })
  name = "";

  @Fields.string({
    required: true,
    includeInApi: Role_Auth.Auth__Admin,
    validate: [Validators.unique(), Validators.email()],
  })
  email = "";

  @Fields.boolean({ required: true, defaultValue: () => false })
  emailVerified = false;

  @Fields.string({ required: false })
  image = "";

  @Fields.createdAt()
  createdAt!: Date;

  @Fields.updatedAt()
  updatedAt!: Date;
}

@Entity<Session>("session", {
  allowApiCrud: Role_Auth.Auth__Admin,
})
export class Session {
  @Fields.string({
    required: true,
    minLength: 8,
    maxLength: 40,
    validate: Validators.unique(),
    allowApiUpdate: false,
  })
  id!: string;

  @Fields.date({ required: true })
  expiresAt = new Date();

  @Fields.string({ required: true, validate: Validators.unique() })
  token = "";

  @Fields.createdAt()
  createdAt!: Date;

  @Fields.updatedAt()
  updatedAt!: Date;

  @Fields.string({ required: false })
  ipAddress = "";

  @Fields.string({ required: false })
  userAgent = "";

  @Fields.string({ required: true })
  userId = "";
  @Relations.toOne<Session, User>(() => User, "id")
  user!: User;
}

@Entity<Account>("account", {
  allowApiCrud: Role_Auth.Auth__Admin,
})
export class Account {
  @Fields.string({
    required: true,
    minLength: 8,
    maxLength: 40,
    validate: Validators.unique(),
    allowApiUpdate: false,
  })
  id!: string;

  @Fields.string({ required: true })
  accountId = "";

  @Fields.string({ required: true })
  providerId = "";

  @Fields.string({ required: true })
  userId = "";
  @Relations.toOne<Account, User>(() => User, "id")
  user!: User;

  @Fields.string({ required: false })
  accessToken = "";

  @Fields.string({ required: false })
  refreshToken = "";

  @Fields.string({ required: false })
  idToken = "";

  @Fields.date({ required: false })
  accessTokenExpiresAt = new Date();

  @Fields.date({ required: false })
  refreshTokenExpiresAt = new Date();

  @Fields.string({ required: false })
  scope = "";

  @Fields.string({ required: false })
  password = "";

  @Fields.createdAt()
  createdAt!: Date;

  @Fields.updatedAt()
  updatedAt!: Date;
}

@Entity<Verification>("verification", {
  allowApiCrud: Role_Auth.Auth__Admin,
})
export class Verification {
  @Fields.string({
    required: true,
    minLength: 8,
    maxLength: 40,
    validate: Validators.unique(),
    allowApiUpdate: false,
  })
  id!: string;

  @Fields.string({ required: true })
  identifier = "";

  @Fields.string({ required: true })
  value = "";

  @Fields.date({ required: true })
  expiresAt = new Date();

  @Fields.createdAt()
  createdAt!: Date;

  @Fields.updatedAt()
  updatedAt!: Date;
}

export const authEntities = {
  User,
  Session,
  Account,
  Verification,
};
