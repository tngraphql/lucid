/*
 * @adonisjs/lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { Exception } from '@poppinss/utils'
import { QueryClientContract } from '@ioc:Adonis/Lucid/Database'
import { BelongsToClientContract } from '@ioc:Adonis/Lucid/Relations'
import { ModelConstructorContract, ModelContract } from '@ioc:Adonis/Lucid/Model'

import { BelongsTo } from './index'
import { BelongsToQueryBuilder } from './QueryBuilder'
import { getValue, managedTransaction } from '../../../utils'

/**
 * Query client for executing queries in scope to the defined
 * relationship
 */
export class BelongsToQueryClient implements BelongsToClientContract
<
BelongsTo,
ModelConstructorContract,
ModelConstructorContract
> {
  constructor (
    public relation: BelongsTo,
    private parent: ModelContract | ModelContract[],
    private client: QueryClientContract,
  ) {
  }

  /**
   * Ensures that persistance is invoked on a single parent instance
   */
  private ensureSingleParent (parent: ModelContract | ModelContract[]): asserts parent is ModelContract {
    if (Array.isArray(parent)) {
      throw new Exception('Cannot associate related models with multiple parent instances')
    }
  }

  /**
   * Returns value for the foreign key from the related model
   */
  private getForeignKeyValue (related: ModelContract, action: string) {
    return getValue(related, this.relation.localKey, this.relation, action)
  }

  /**
   * Returns instance of query builder
   */
  public query (): any {
    return new BelongsToQueryBuilder(
      this.client.knexQuery(),
      this.client,
      this.parent,
      this.relation,
    )
  }

  /**
   * Returns instance of query builder with `eager=true`
   */
  public eagerQuery (): any {
    return new BelongsToQueryBuilder(
      this.client.knexQuery(),
      this.client,
      this.parent,
      this.relation,
      true,
    )
  }

  /**
   * Associate the related model with the parent model
   */
  public async associate (related: ModelContract) {
    const parent = this.parent
    this.ensureSingleParent(parent)

    await managedTransaction(parent.trx || this.client, async (trx) => {
      related.trx = trx
      await related.save()

      parent[this.relation.foreignKey] = this.getForeignKeyValue(related, 'associate')
      parent.trx = trx
      await parent.save()
    })
  }

  /**
   * Drop association
   */
  public async dissociate () {
    this.ensureSingleParent(this.parent)
    this.parent[this.relation.foreignKey] = null
    await this.parent.save()
  }
}
