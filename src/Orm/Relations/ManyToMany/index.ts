/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { QueryClientContract } from '../../../Contracts/Database/QueryClientContract';
import { LucidModel } from '../../../Contracts/Model/LucidModel';
import { LucidRow } from '../../../Contracts/Model/LucidRow';
import { ManyToManyRelationContract } from '../../../Contracts/Orm/Relations/ManyToManyRelationContract';
import { ManyToMany as ModelManyToMany, ManyToManyRelationOptions } from '../../../Contracts/Orm/Relations/types';
import { ensureRelationIsBooted } from '../../../utils'

import { KeysExtractor } from '../KeysExtractor'
import { ManyToManyQueryClient } from './QueryClient'

/**
 * Manages loading and persisting many to many relationship
 */
export class ManyToMany implements ManyToManyRelationContract<LucidModel, LucidModel> {
    public type = 'manyToMany' as const

    public booted: boolean = false

    public serializeAs = this.options.serializeAs === undefined
        ? this.relationName
        : this.options.serializeAs

    /**
     * Available after boot is invoked
     */
    public localKey: string
    public localKeyColumnName: string

    public relatedKey: string
    public relatedKeyColumnName: string

    public pivotForeignKey: string
    public pivotRelatedForeignKey: string

    public pivotTable: string
    public extrasPivotColumns: string[] = this.options.pivotColumns || []

    /**
     * Reference to the onQuery hook defined by the user
     */
    public onQueryHook = this.options.onQuery

    constructor(
        public relationName: string,
        public relatedModel: () => LucidModel,
        private options: ManyToManyRelationOptions<ModelManyToMany<LucidModel>>,
        public model: LucidModel
    ) {
    }

    /**
     * Returns the alias for the pivot key
     */
    public pivotAlias(key: string): string {
        return `pivot_${ key }`
    }

    /**
     * Boot the relationship and ensure that all keys are in
     * place for queries to do their job.
     */
    public boot() {
        if ( this.booted ) {
            return
        }

        const relatedModel = this.relatedModel()

        /**
         * Extracting keys from the model and the relation model. The keys
         * extractor ensures all the required columns are defined on
         * the models for the relationship to work
         */
        const { localKey, relatedKey } = new KeysExtractor(this.model, this.relationName, {
            localKey: {
                model: this.model,
                key: (
                    this.options.localKey ||
                    this.model.$configurator.getLocalKey(this.type, this.model, relatedModel)
                )
            },
            relatedKey: {
                model: relatedModel,
                key: (
                    this.options.relatedKey ||
                    this.model.$configurator.getLocalKey(this.type, this.model, relatedModel)
                )
            }
        }).extract()

        this.pivotTable = this.options.pivotTable || this.model.$configurator.getPivotTableName(
            this.type,
            this.model,
            relatedModel,
            this.relationName
        )

        /**
         * Keys on the parent model
         */
        this.localKey = localKey.attributeName
        this.localKeyColumnName = localKey.columnName

        /**
         * Keys on the related model
         */
        this.relatedKey = relatedKey.attributeName
        this.relatedKeyColumnName = relatedKey.columnName

        /**
         * Parent model foreign key in the pivot table
         */
        this.pivotForeignKey =
            this.options.pivotForeignKey ||
            this.model.$configurator.getPivotForeignKey(this.type, this.model, relatedModel, this.relationName)

        /**
         * Related model foreign key in the pivot table
         */
        this.pivotRelatedForeignKey =
            this.options.pivotRelatedForeignKey ||
            this.model.$configurator.getPivotForeignKey(this.type, relatedModel, this.model, this.relationName)

        /**
         * Booted successfully
         */
        this.booted = true
    }

    /**
     * Set related model instances
     */
    public setRelated(parent: LucidRow, related: LucidRow[]): void {
        ensureRelationIsBooted(this)
        parent.$setRelated(this.relationName as any, related)
    }

    /**
     * Push related model instance(s)
     */
    public pushRelated(parent: LucidRow, related: LucidRow | LucidRow[]): void {
        ensureRelationIsBooted(this)
        parent.$pushRelated(this.relationName as any, related as any)
    }

    /**
     * Finds and set the related model instances next to the parent
     * models.
     */
    public setRelatedForMany(parent: LucidRow[], related: LucidRow[]): void {
        ensureRelationIsBooted(this)
        const pivotForeignKeyAlias = this.pivotAlias(this.pivotForeignKey)

        parent.forEach((parentModel) => {
            this.setRelated(
                parentModel,
                related.filter((relatedModel) => {
                    const value = parentModel[this.localKey]
                    return value !== undefined && relatedModel.$extras[pivotForeignKeyAlias] == value
                })
            )
        })
    }

    /**
     * Returns an instance of query client for invoking queries
     */
    public client(parent: LucidRow, client: QueryClientContract): any {
        ensureRelationIsBooted(this)
        return new ManyToManyQueryClient(this, parent, client)
    }

    /**
     * Returns an instance of eager query builder
     */
    public eagerQuery(parent: LucidRow[], client: QueryClientContract) {
        return ManyToManyQueryClient.eagerQuery(client, this, parent)
    }
}
