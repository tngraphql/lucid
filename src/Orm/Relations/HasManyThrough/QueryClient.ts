/*
 * @adonisjs/lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { QueryClientContract } from '@ioc:Adonis/Lucid/Database'
import { ModelConstructorContract, ModelContract } from '@ioc:Adonis/Lucid/Model'
import { RelationBaseQueryClientContract } from '@ioc:Adonis/Lucid/Relations'

import { HasManyThrough } from './index'
import { HasManyThroughQueryBuilder } from './QueryBuilder'

/**
 * Query client for executing queries in scope to the defined
 * relationship
 */
export class HasManyThroughClient implements RelationBaseQueryClientContract<
HasManyThrough,
ModelConstructorContract,
ModelConstructorContract
> {
  constructor (
    public relation: HasManyThrough,
    private parent: ModelContract | ModelContract[],
    private client: QueryClientContract,
  ) {
  }

  /**
   * Returns an instance of has many through query builder
   */
  public query (): any {
    return new HasManyThroughQueryBuilder(
      this.client.knexQuery(),
      this.client,
      this.parent,
      this.relation,
    )
  }

  /**
   * Returns an instance of has many through eager query builder
   */
  public eagerQuery (): any {
    return new HasManyThroughQueryBuilder(
      this.client.knexQuery(),
      this.client,
      this.parent,
      this.relation,
      true,
    )
  }
}
