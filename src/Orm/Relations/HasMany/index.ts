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
import { OneOrMany } from '../../../Contracts/Model/types';
import { HasManyRelationContract } from '../../../Contracts/Orm/Relations/HasManyRelationContract';
import { HasMany as ModelHasMany, RelationOptions } from '../../../Contracts/Orm/Relations/types';
import { ensureRelationIsBooted } from '../../../utils'

import { KeysExtractor } from '../KeysExtractor'
import { HasManyQueryClient } from './QueryClient'

/**
 * Manages persisting and fetching relationships
 */
export class HasMany implements HasManyRelationContract<LucidModel, LucidModel> {
    /**
     * The relationship name
     */
    public readonly type = 'hasMany'

    /**
     * Whether or not the relationship instance has been
     * booted
     */
    public booted: boolean = false

    /**
     * The key name for serializing the relationship
     */
    public serializeAs = this.options.serializeAs === undefined
        ? this.relationName
        : this.options.serializeAs

    /**
     * Local key is reference to the primary key in the self table
     * @note: Available after boot is invoked
     */
    public localKey: string

    /**
     * Foreign key is reference to the foreign key in the related table
     * @note: Available after boot is invoked
     */
    public foreignKey: string

    /**
     * Reference to the onQuery hook defined by the user
     */
    public onQueryHook = this.options.onQuery

    constructor(
        public relationName: string,
        public relatedModel: () => LucidModel,
        private options: RelationOptions<ModelHasMany<LucidModel>>,
        public model: LucidModel
    ) {
    }

    /**
     * Returns a boolean saving related row belongs to the parent
     * row or not.
     */
    private isRelatedRow(parent: LucidRow, related: LucidRow) {
        return parent[this.localKey] !== undefined && related[this.foreignKey] === parent[this.localKey]
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
        const { localKey, foreignKey } = new KeysExtractor(this.model, this.relationName, {
            localKey: {
                model: this.model,
                key: (
                    this.options.localKey ||
                    this.model.$configurator.getLocalKey(this.type, this.model, relatedModel)
                )
            },
            foreignKey: {
                model: relatedModel,
                key: (
                    this.options.foreignKey ||
                    this.model.$configurator.getForeignKey(this.type, this.model, relatedModel)
                )
            }
        }).extract()

        /**
         * Keys on the parent model
         */
        this.localKey = localKey.attributeName

        /**
         * Keys on the related model
         */
        this.foreignKey = foreignKey.attributeName

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

        related.forEach((relatedRow) => {
            if ( ! this.isRelatedRow(parent, relatedRow) ) {
                throw new Error('malformed setRelated call')
            }
        })

        parent.$setRelated(this.relationName, related)
    }

    /**
     * Push related model instance(s)
     */
    public pushRelated(parent: LucidRow, related: LucidRow | LucidRow[]): void {
        ensureRelationIsBooted(this)

        if ( Array.isArray(related) ) {
            related.forEach((relatedRow) => {
                if ( ! this.isRelatedRow(parent, relatedRow) ) {
                    throw new Error('malformed pushRelated call')
                }
            })
        } else {
            if ( ! this.isRelatedRow(parent, related) ) {
                throw new Error('malformed pushRelated call')
            }
        }

        parent.$pushRelated(this.relationName, related)
    }

    /**
     * Finds and set the related model instances next to the parent
     * models.
     */
    public setRelatedForMany(parent: LucidRow[], related: LucidRow[]): void {
        ensureRelationIsBooted(this)

        parent.forEach((parentModel) => {
            const relatedRows = related.filter((relatedModel) => this.isRelatedRow(parentModel, relatedModel))
            this.setRelated(parentModel, relatedRows)
        })
    }

    /**
     * Returns an instance of query client for invoking queries
     */
    public client(parent: LucidRow, client: QueryClientContract): any {
        ensureRelationIsBooted(this)
        return new HasManyQueryClient(this, parent, client)
    }

    /**
     * Returns an instance of the eager query
     */
    public eagerQuery(parent: OneOrMany<LucidRow>, client: QueryClientContract) {
        ensureRelationIsBooted(this)
        return HasManyQueryClient.eagerQuery(client, this, parent)
    }
}
