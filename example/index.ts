// import { BaseModel, HasOne } from '@ioc:Adonis/Lucid/Orm'
import { Database } from '../src/Database'
import { Logger } from '@adonisjs/logger/build/src/Logger'
import { BaseModel } from '../src/Orm/BaseModel'
import { Adapter } from '../src/Orm/Adapter'
import { DatabaseConfigContract } from '@ioc:Adonis/Lucid/Database'
import { Profiler } from '@adonisjs/profiler/build/standalone'
import { column } from '../src/Orm/Decorators'

require('dotenv')

const logger = new Logger({
  name: 'asd',
  level: 'silent',
  enabled: true,
})

const profiler = new Profiler('', logger,{
  enabled: true,
  whitelist: [],
  blacklist: [],
})

const config: DatabaseConfigContract = {
  connection: 'mysql',
  connections: {
    mysql: {
      client: 'mysql',
      connection: {
        host: 'localhost',
        port: 3306,
        database: 'adonis',
        user: 'root',
        password: '123123As',
      },
      useNullAsDefault: true,
    },
  },
}

const db: Database = new Database(config, logger, profiler)

BaseModel.$adapter = new Adapter(db)

class Profiles extends BaseModel {
  @column({isPrimary: true})
  public id: string

  @column({ columnName: 'name'})
  public nguyen241242: string
  // public $columns: Pick<Profiles, 'id' | 'nguyen241242'>
}

async function main () {
  // await Profiles.create({ name: '12435' })
  const data = await Profiles.query().where('nguyen241242', '12435').first()
  console.log(data.toJSON())
  // await db.manager.closeAll()
}

main()

// Profiles.create({ name: '12435' })

// Profiles.all()
// Profiles
//   .all().then(data => {
//     console.log(data)
//   })

// db.manager.closeAll()

// console.log(db)

//
// class Profile extends BaseModel {
//   public id: string
//   public userId: string
//   public $columns: Pick<Profile, 'id' | 'userId'>
// }
//
// class User extends BaseModel {
//   public id: string
//   public username: string
//   public $columns: Pick<User, 'id' | 'username'>
//
//   public profile: HasOne<Profile>
// }
//
// User.create({ id: '1' })
// User.fetchOrCreateMany('id', [{ id: '1', username: 'virk' }])
// User.create({ id: '1', username: 'virk' })
// User.create({ id: '1', username: 'virk' })
// User.create({ id: '1' })
//
// const user = new User()
// user.related('profile').create({ id: '1', userId: '1' })
