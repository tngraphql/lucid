/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/21/2020
 * Time: 10:27 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { HasOne } from '../src/Contracts/Orm/Relations/types';
import { scope } from '../src/Helpers/scope';
import { BaseModel } from '../src/Orm/BaseModel/BaseModel';
import { hasOne } from '../src/Orm/Decorators';

class Profile extends BaseModel {
    public id: string
    public userId: string
    public user: HasOne<typeof User>

    static table = '123';
}

export class User extends BaseModel {
    public id: string
    public username: string

    @hasOne(() => Profile, {
        onQuery: (builder) => builder.preload('user'),
    })
    public profile: HasOne<typeof Profile>

    public static active = scope<typeof User>((builder) => {
        builder.apply((scopes) => scopes.country('India'))
    })
    public static country = scope((builder, _country: string) => {
        builder.whereIn('', [])
    })
}

User.query().apply((scopes) => scopes.active().country('India'))

User.create({ id: '1', username: 'a' })
User.fetchOrCreateMany('id', [{ id: '1', username: 'virk' }])
User.create({ id: '1', username: 'virk' })
User.create({ id: '1', username: 'virk' })
User.create({ id: '1' })
