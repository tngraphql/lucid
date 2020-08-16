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
import { MorphToRelationContract } from '../../../Contracts/Orm/Relations/MorphToRelationContract';
import {MorphTo as ModelMorphTo, MorphToRelationOptions} from '../../../Contracts/Orm/Relations/types';
import {ensureRelationIsBooted, getValue} from '../../../utils'
import { KeysExtractor } from '../KeysExtractor'
import { MorphToQueryClient } from './QueryClient'
import {Relation} from "../Base/Relation";
import {RelationQueryBuilderContract} from "../../../Contracts/Orm/Relations/RelationQueryBuilderContract";
import {Exception} from "@poppinss/utils/build";

/**
 * Manages loading and persisting has one relationship
 */
export class MorphTo extends Relation implements MorphToRelationContract<LucidModel, LucidModel>{
    public readonly type = 'morphTo'

    public booted: boolean = false;

    public morphType: string = this.options.type;

    public serializeAs = this.relationName

    /**
     * Available after boot is invoked
     */
    public localKey: string = this.options.localKey;
    public foreignKey: string = this.options.id;

    /**
     * Reference to the onQuery hook defined by the user
     */
    public onQueryHook = this.options.onQuery

    constructor(
        public relationName: string,
        public relatedModel: () => LucidModel,
        private options: MorphToRelationOptions<ModelMorphTo<LucidModel>>,
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
        const { foreignKey, morphType } = new KeysExtractor(this.model, this.relationName, {
            foreignKey: {
                model: relatedModel,
                key: (
                    this.options.id
                )
            },
            morphType: {
                model: relatedModel,
                key: (
                    this.options.type
                )
            }
        }).extract()

        /**
         * Keys on the related model
         */
        this.foreignKey = foreignKey.attributeName

        this.morphType = morphType.attributeName;

        /**
         * Booted successfully
         */
        this.booted = true
    }

    public bootTo() {
        const relatedModel = this.relatedModel()

        /**
         * Extracting keys from the model and the relation model. The keys
         * extractor ensures all the required columns are defined on
         * the models for the relationship to work
         */
        const { localKey } = new KeysExtractor(this.model, this.relationName, {
            localKey: {
                model: relatedModel,
                key: (
                    this.options.localKey ||
                    this.model.$configurator.getLocalKey(this.type, relatedModel, relatedModel)
                )
            }
        }).extract()

        /**
         * Keys on the parent model
         */
        this.localKey = localKey.attributeName
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
        // ensureRelationIsBooted(this)
        //
        // /**
        //  * The related model will always be equal or less than the parent
        //  * models. So we loop over them to lower down the number of
        //  * iterations.
        //  */
        // related.forEach((relatedModel) => {
        //     const match = parent.find((parentModel) => {
        //         const value = parentModel[this.localKey]
        //         return value !== undefined && value === relatedModel[this.foreignKey]
        //     })
        //     if ( match ) {
        //         this.setRelated(match, relatedModel)
        //     }
        // })
    }

    /**
     * Returns an instance of query client for invoking queries
     */
    public client(parent: LucidRow, client: QueryClientContract): any {
        const relatedModel = () => this.createModelByType(parent[this.morphType]);
        const relation = new MorphTo(this.relationName, relatedModel, this.options, this.model);
        relation.bootTo();
        ensureRelationIsBooted(this)
        return new MorphToQueryClient(relation, parent, client)
    }

    protected _client;
    protected _query;

    /**
     * Returns eager query instance
     */
    public eagerQuery(parent: OneOrMany<LucidRow>, client: QueryClientContract): any {
        ensureRelationIsBooted(this);
        this._query = MorphToQueryClient.eagerQuery(client, this, parent);
        this._client = client;

        if (parent && !Array.isArray(parent)) {
            const relatedModel = () => this.createModelByType(parent[this.morphType]);
            const relation = new MorphTo(this.relationName, relatedModel, this.options, this.model);
            relation.bootTo();

            return MorphToQueryClient.eagerQuery(client, relation, parent);
        } else {
            this.buildDictionary(parent);
        }
        return this._query;
    }

    async getEager(query: RelationQueryBuilderContract<any, any>) {
        for (const type in this.dictionary) {
            this.matchToMorphParents(type, await this.getResultsByType(type));
        }

        return [];
    }

    protected matchToMorphParents(type, results) {
        for (const result of results) {
            const localKey = 'id'+ (this.options.localKey ? result[this.localKey] : result.$primaryKeyValue);
            if (this.dictionary[type][localKey]) {
                const models: any[] = Object.values(this.dictionary[type][localKey]);
                for (let model of models) {
                    this.setRelated(model, result);
                }
            }
        }
    }

    protected async getResultsByType(type) {
        const instance = this.createModelByType(type);
        const localKey = this.options.localKey || instance.primaryKey;

        const query = MorphToQueryClient.eagerQuery(this._client, {
            relatedModel: () => instance,
            model: this.model,
            localKey,
            type: this.type
        } as any, null);

        query.mergeConstraintsFrom(
            this._query
        )
            .whereIn(
                instance.getTable() + '.' + localKey,
                this.gatherKeysByType(type)
            );

        return query.selectRelationKeys()
            .exec();
    }

    /**
     * Raises exception that FK value is null
     */
    private raiseMissingForeignKey(): never {
        const { relationName, foreignKey } = this
        const modelName = this.model.name

        throw new Exception(
            [
                `Cannot preload "${ relationName }", value of "${ modelName }.${ foreignKey }" is undefined.`,
                'Make sure to set "null" as the default value for foreign keys'
            ].join(' '),
            500
        )
    }

    protected gatherKeysByType(type) {
        const res = Object.values(this.dictionary[type]).map((models: any) => {
            return getValue(models.slice(0).pop(), this.foreignKey, this, 'select');
        });

        return Array.from(new Set(res));
    }

    protected createModelByType(type) {
        const Model = this.getActualClassNameForMorph(type);
        return Model;
    }

    protected dictionary: any = {};

    protected buildDictionary(models: any) {
        if (!Array.isArray(models)) {
            models = [models];
        }

        for (let model of models) {
            const type = model[this.morphType];
            if (type) {
                const Model = model.constructor as LucidModel;

                if (!this.dictionary[type]) {
                    this.dictionary[type] = {};
                }
                if (!this.dictionary[type]['id' + model[this.foreignKey]]) {
                    this.dictionary[type]['id' + model[this.foreignKey]] = [];
                }
                this.dictionary[type]['id' + model[this.foreignKey]].push(model);
            }
        }
    }
}
