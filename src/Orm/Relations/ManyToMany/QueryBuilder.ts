/*
 * @adonisjs/lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import knex from 'knex'
import { QueryClientContract } from '@ioc:Adonis/Lucid/Database'
import { ModelConstructorContract, ModelContract } from '@ioc:Adonis/Lucid/Model'
import { ManyToManyQueryBuilderContract } from '@ioc:Adonis/Lucid/Relations'

import { ManyToMany } from './index'
import { BaseQueryBuilder } from '../Base/QueryBuilder'
import { getValue, unique, isObject } from '../../../utils'

/**
 * Extends the model query builder for executing queries in scope
 * to the current relationship
 */
export class ManyToManyQueryBuilder extends BaseQueryBuilder implements ManyToManyQueryBuilderContract<
ModelConstructorContract,
ModelConstructorContract
> {
  private cherryPickingKeys: boolean = false
  private appliedConstraints: boolean = false

  /**
   * Do not wrap result to model instances when query builder
   * is initiated with `pivotOnly` flag.
   */
  protected wrapResultsToModelInstances = !this.pivotOnly

  constructor (
    builder: knex.QueryBuilder,
    client: QueryClientContract,
    private parent: ModelContract | ModelContract[],
    private relation: ManyToMany,
    private pivotOnly: boolean,
    isEager: boolean = false,
  ) {
    super(builder, client, relation, isEager, (userFn) => {
      return (__builder) => {
        userFn(
          new ManyToManyQueryBuilder(__builder, this.client, this.parent, this.relation, this.pivotOnly, isEager),
        )
      }
    })
  }

  /**
   * Profiler data for ManyToMany relationship
   */
  protected profilerData () {
    return {
      relation: this.relation.type,
      model: this.relation.model.name,
      pivotTable: this.relation.pivotTable,
      relatedModel: this.relation.relatedModel().name,
    }
  }

  /**
   * The keys for constructing the join query
   */
  protected getRelationKeys (): string[] {
    return [
      `${this.relation.relatedModel().table}.${this.relation.relatedKeyColumnName}`,
    ]
  }

  /**
   * Prefixes the pivot table name to the key
   */
  private prefixPivotTable (key: string) {
    return this.pivotOnly ? key : `${this.relation.pivotTable}.${key}`
  }

  /**
   * Adds where constraint to the pivot table
   */
  private addWhereConstraints () {
    const queryAction = this.queryAction()

    /**
     * Eager query contraints
     */
    if (Array.isArray(this.parent)) {
      this.whereInPivot(this.relation.pivotForeignKey, unique(this.parent.map((model) => {
        return getValue(model, this.relation.localKey, this.relation, queryAction)
      })))
      return
    }

    /**
     * Query constraints
     */
    const value = getValue(this.parent, this.relation.localKey, this.relation, queryAction)
    this.wherePivot(this.relation.pivotForeignKey, value)
  }

  /**
   * Transforms the selected column names by prefixing the
   * table name
   */
  private transformRelatedTableColumns (columns: any[]) {
    if (this.pivotOnly) {
      return columns
    }

    const relatedTable = this.relation.relatedModel().table
    return columns.map((column) => {
      if (typeof (column) === 'string') {
        return `${relatedTable}.${column}`
      }

      if (Array.isArray(column)) {
        return this.transformRelatedTableColumns(column)
      }

      if (isObject(column)) {
        return Object.keys(column).reduce((result, alias) => {
          result[alias] = `${relatedTable}.${column[alias]}`
          return result
        }, {})
      }

      return column
    })
  }

  /**
   * Select keys from the related table
   */
  public select (...args: any): this {
    this.cherryPickingKeys = true
    this.knexQuery.select(this.transformRelatedTableColumns(args))
    return this
  }

  /**
   * Add where clause with pivot table prefix
   */
  public wherePivot (key: any, operator?: any, value?: any): this {
    if (value !== undefined) {
      this.knexQuery.where(this.prefixPivotTable(key), operator, this.transformValue(value))
    } else if (operator !== undefined) {
      this.knexQuery.where(this.prefixPivotTable(key), this.transformValue(operator))
    } else {
      this.knexQuery.where(this.transformCallback(key))
    }

    return this
  }

  /**
   * Add or where clause with pivot table prefix
   */
  public orWherePivot (key: any, operator?: any, value?: any): this {
    if (value !== undefined) {
      this.knexQuery.orWhere(this.prefixPivotTable(key), operator, this.transformValue(value))
    } else if (operator !== undefined) {
      this.knexQuery.orWhere(this.prefixPivotTable(key), this.transformValue(operator))
    } else {
      this.knexQuery.orWhere(this.transformCallback(key))
    }

    return this
  }

  /**
   * Alias for wherePivot
   */
  public andWherePivot (key: any, operator?: any, value?: any): this {
    return this.wherePivot(key, operator, value)
  }

  /**
   * Add where not pivot
   */
  public whereNotPivot (key: any, operator?: any, value?: any): this {
    if (value !== undefined) {
      this.knexQuery.whereNot(this.prefixPivotTable(key), operator, this.transformValue(value))
    } else if (operator !== undefined) {
      this.knexQuery.whereNot(this.prefixPivotTable(key), this.transformValue(operator))
    } else {
      this.knexQuery.whereNot(this.transformCallback(key))
    }

    return this
  }

  /**
   * Add or where not pivot
   */
  public orWhereNotPivot (key: any, operator?: any, value?: any): this {
    if (value !== undefined) {
      this.knexQuery.orWhereNot(this.prefixPivotTable(key), operator, this.transformValue(value))
    } else if (operator !== undefined) {
      this.knexQuery.orWhereNot(this.prefixPivotTable(key), this.transformValue(operator))
    } else {
      this.knexQuery.orWhereNot(this.transformCallback(key))
    }

    return this
  }

  /**
   * Alias for `whereNotPivot`
   */
  public andWhereNotPivot (key: any, operator?: any, value?: any): this {
    return this.whereNotPivot(key, operator, value)
  }

  /**
   * Adds where in clause
   */
  public whereInPivot (key: any, value: any) {
    value = Array.isArray(value)
      ? value.map((one) => this.transformValue(one))
      : this.transformValue(value)

    key = Array.isArray(key)
      ? key.map((one) => this.prefixPivotTable(one))
      : this.prefixPivotTable(key)

    this.knexQuery.whereIn(key, value)
    return this
  }

  /**
   * Adds or where in clause
   */
  public orWhereInPivot (key: any, value: any) {
    value = Array.isArray(value)
      ? value.map((one) => this.transformValue(one))
      : this.transformValue(value)

    key = Array.isArray(key)
      ? key.map((one) => this.prefixPivotTable(one))
      : this.prefixPivotTable(key)

    this.knexQuery.orWhereIn(key, value)
    return this
  }

  /**
   * Alias from `whereInPivot`
   */
  public andWhereInPivot (key: any, value: any): this {
    return this.whereInPivot(key, value)
  }

  /**
   * Adds where not in clause
   */
  public whereNotInPivot (key: any, value: any) {
    value = Array.isArray(value)
      ? value.map((one) => this.transformValue(one))
      : this.transformValue(value)

    key = Array.isArray(key)
      ? key.map((one) => this.prefixPivotTable(one))
      : this.prefixPivotTable(key)

    this.knexQuery.whereNotIn(key, value)
    return this
  }

  /**
   * Adds or where not in clause
   */
  public orWhereNotInPivot (key: any, value: any) {
    value = Array.isArray(value)
      ? value.map((one) => this.transformValue(one))
      : this.transformValue(value)

    key = Array.isArray(key)
      ? key.map((one) => this.prefixPivotTable(one))
      : this.prefixPivotTable(key)

    this.knexQuery.orWhereNotIn(key, value)
    return this
  }

  /**
   * Alias from `whereNotInPivot`
   */
  public andWhereNotInPivot (key: any, value: any): this {
    return this.whereNotInPivot(key, value)
  }

  /**
   * Select pivot columns
   */
  public pivotColumns (columns: string[]): this {
    this.knexQuery.select(columns.map((column) => {
      return `${this.prefixPivotTable(column)} as ${this.relation.pivotAlias(column)}`
    }))
    return this
  }

  /**
   * Applying query constraints to scope them to relationship
   * only.
   */
  public applyConstraints () {
    if (this.appliedConstraints) {
      return
    }

    this.appliedConstraints = true

    if (this.pivotOnly || ['delete', 'update'].includes(this.queryAction())) {
      this.from(this.relation.pivotTable)
      this.addWhereConstraints()
      return
    }

    /**
     * Add select statements only when not running aggregate
     * queries. The end user can still select columns
     */
    if (!this.hasAggregates) {
      /**
       * Select * from related model when user is not cherry picking
       * keys
       */
      if (!this.cherryPickingKeys) {
        this.select('*')
      }

      /**
       * Select columns from the pivot table
       */
      this.pivotColumns(
        [
          this.relation.pivotForeignKey,
          this.relation.pivotRelatedForeignKey,
        ].concat(this.relation.extrasPivotColumns),
      )
    }

    /**
     * Add inner join between related model and pivot table
     */
    this.innerJoin(
      this.relation.pivotTable,
      `${this.relation.relatedModel().table}.${this.relation.relatedKeyColumnName}`,
      `${this.relation.pivotTable}.${this.relation.pivotRelatedForeignKey}`,
    )

    this.addWhereConstraints()
  }
}
