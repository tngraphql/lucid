/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@poppinss/utils/build'
import { QueryClientContract } from '../../Contracts/Database/QueryClientContract';
import { LucidModel } from '../../Contracts/Model/LucidModel';
import { LucidRow, ModelObject } from '../../Contracts/Model/LucidRow';
import { RelationQueryBuilderContract } from '../../Contracts/Orm/Relations/RelationQueryBuilderContract';
import { PreloaderContract, RelationshipsContract } from '../../Contracts/Orm/Relations/types';

/**
 * Exposes the API to define and preload relationships in reference to
 * a model
 */
export class Preloader implements PreloaderContract<LucidRow> {
    private preloads: {
        [name: string]: {
            relation: RelationshipsContract,
            callback?: (builder: RelationQueryBuilderContract<LucidModel, any>) => void,
        }
    } = {}

    /**
     * When invoked via query builder. The preloader will get the sideloaded
     * object, that should be transferred to relationship model instances.
     */
    private sideloaded: ModelObject = {}

    constructor(private model: LucidModel) {
    }

    /**
     * Processes a relationship for a single parent
     */
    private async processRelation(
        name: string,
        parent: LucidRow,
        client: QueryClientContract
    ) {
        const { relation, callback } = this.preloads[name]
        const query = relation.eagerQuery(parent, client).sideload(this.sideloaded)

        /**
         * Pass query to end user for adding more constraints
         */
        if ( typeof (callback) === 'function' ) {
            callback(query)
        }

        const result = await query.selectRelationKeys().exec()

        /**
         * hasOne and belongsTo will always return an array of a single row (if done right)
         */
        if ( relation.type === 'hasOne' || relation.type === 'belongsTo' ) {
            relation.setRelated(parent, result[0])
            return
        }

        /**
         * Set array of related instances
         */
        relation.setRelated(parent, result)
    }

    /**
     * Process a given relationship for many parent instances. This happens
     * during eagerloading
     */
    private async processRelationForMany(
        name: string,
        parent: LucidRow[],
        client: QueryClientContract
    ) {
        const { relation, callback } = this.preloads[name]
        const query = relation.eagerQuery(parent, client).sideload(this.sideloaded)

        /**
         * Pass query to end user for adding more constraints
         */
        if ( typeof (callback) === 'function' ) {
            callback(query)
        }

        const result = await query.selectRelationKeys().exec()

        /**
         * Set array of related instances
         */
        relation.setRelatedForMany(parent, result)
    }

    /**
     * Define a relationship to preload
     */
    public preload(name: any, callback?: any): this {
        const relation = this.model.$getRelation(name) as RelationshipsContract
        if ( ! relation ) {
            throw new Exception(
                `"${ name }" is not defined as a relationship on "${ this.model.name }" model`,
                500,
                'E_UNDEFINED_RELATIONSHIP'
            )
        }

        relation.boot()
        this.preloads[name] = {
            relation: relation,
            callback: callback
        }

        return this
    }

    /**
     * Define attributes to be passed to all the model instance as
     * sideloaded attributes
     */
    public sideload(values: ModelObject): this {
        this.sideloaded = values
        return this
    }

    /**
     * Process of all the preloaded relationships for a single parent
     */
    public async processAllForOne(parent: LucidRow, client: QueryClientContract) {
        await Promise.all(Object.keys(this.preloads).map((relationName) => {
            return this.processRelation(relationName, parent, client)
        }))
    }

    /**
     * Process of all the preloaded relationships for many parents
     */
    public async processAllForMany(parent: LucidRow[], client: QueryClientContract) {
        if ( ! parent.length ) {
            return
        }

        await Promise.all(Object.keys(this.preloads).map((relationName) => {
            return this.processRelationForMany(relationName, parent, client)
        }))
    }
}
