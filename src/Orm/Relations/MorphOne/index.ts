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
import { MorphOneRelationContract } from '../../../Contracts/Orm/Relations/MorphOneRelationContract';
import {
    MorphOne as ModelMorphOne,
    MorphOneRelationOptions,
    RelationOptions
} from '../../../Contracts/Orm/Relations/types';
import { ensureRelationIsBooted } from '../../../utils'

import { KeysExtractor } from '../KeysExtractor'
import { MorphOneQueryClient } from './QueryClient'
import {Relation} from "../Base/Relation";

/**
 * Manages loading and persisting has one relationship
 */
export class MorphOne extends Relation implements MorphOneRelationContract<LucidModel, LucidModel>{
    public readonly type = 'morphOne'

    public booted: boolean = false

    public serializeAs = this.relationName

    /**
     * Available after boot is invoked
     */
    public localKey: string
    public foreignKey: string
    public morphType: string

    /**
     * Reference to the onQuery hook defined by the user
     */
    public onQueryHook = this.options.onQuery

    constructor(
        public relationName: string,
        public relatedModel: () => LucidModel,
        private options: MorphOneRelationOptions<ModelMorphOne<LucidModel>>,
        public model: LucidModel
    ) {
        super();
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
        const { localKey, foreignKey, morphType } = new KeysExtractor(this.model, this.relationName, {
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
                    this.options.id ||
                    this.model.$configurator.getForeignKey(this.type, this.model, relatedModel)
                )
            },
            morphType: {
                model: relatedModel,
                key: (
                    this.options.type ||
                    this.model.$configurator.getForeignKey(this.type, this.model, relatedModel)
                )
            }
        }).extract()

        this.morphType = morphType.attributeName;

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
     * Set related model instance
     */
    public setRelated(parent: LucidRow, related: LucidRow | null): void {
        ensureRelationIsBooted(this)
        if ( ! related ) {
            return
        }

        parent.$setRelated(this.relationName as any, related)
    }

    /**
     * Push related model instance
     */
    public pushRelated(parent: LucidRow, related: LucidRow | null): void {
        ensureRelationIsBooted(this)

        if ( ! related ) {
            return
        }

        parent.$pushRelated(this.relationName as any, related)
    }

    /**
     * Finds and set the related model instance next to the parent
     * models.
     */
    public setRelatedForMany(parent: LucidRow[], related: LucidRow[]): void {
        ensureRelationIsBooted(this)

        /**
         * The related model will always be equal or less than the parent
         * models. So we loop over them to lower down the number of
         * iterations.
         */
        related.forEach((relatedModel) => {
            const match = parent.find((parentModel) => {
                const value = parentModel[this.localKey]
                return value !== undefined && value === relatedModel[this.foreignKey]
            })
            if ( match ) {
                this.setRelated(match, relatedModel)
            }
        })
    }

    /**
     * Returns an instance of query client for invoking queries
     */
    public client(parent: LucidRow, client: QueryClientContract): any {
        ensureRelationIsBooted(this)
        return new MorphOneQueryClient(this, parent, client)
    }

    /**
     * Returns eager query instance
     */
    public eagerQuery(parent: OneOrMany<LucidRow>, client: QueryClientContract): any {
        ensureRelationIsBooted(this)
        return MorphOneQueryClient.eagerQuery(client, this, parent)
    }
}
