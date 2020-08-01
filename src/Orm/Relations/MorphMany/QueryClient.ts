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
import { MorphManyClientContract } from '../../../Contracts/Orm/Relations/MorphManyClientContract';
import { LucidModel } from '../../../Contracts/Model/LucidModel';
import { LucidRow, ModelObject } from '../../../Contracts/Model/LucidRow';
import { OneOrMany } from '../../../Contracts/Model/types';
import { getValue, managedTransaction } from '../../../utils'

import { MorphMany } from './index'
import { MorphManyQueryBuilder } from './QueryBuilder'

/**
 * Query client for executing queries in scope to the defined
 * relationship
 */
export class MorphManyQueryClient implements MorphManyClientContract<MorphMany, LucidModel> {
    constructor(
        public relation: MorphMany,
        private parent: LucidRow,
        private client: QueryClientContract
    ) {
    }

    /**
     * Generate a related query builder
     */
    public static query(client: QueryClientContract, relation: MorphMany, rows: OneOrMany<LucidRow>, isEagerQuery = false) {
        const builder = new MorphManyQueryBuilder(client.knexQuery(), client, rows, relation)

        const query = relation.relatedModel().registerGlobalScopes(builder);

        query.isEagerQuery = isEagerQuery;

        typeof (relation.onQueryHook) === 'function' && relation.onQueryHook(query)
        return query
    }

    /**
     * Generate a related eager query builder
     */
    public static eagerQuery(client: QueryClientContract, relation: MorphMany, rows: OneOrMany<LucidRow>) {
        return this.query(client, relation, rows, true);
    }

    /**
     * Returns value for the foreign key
     */
    private getForeignKeyValue(parent: LucidRow, action: string) {
        return getValue(parent, this.relation.localKey, this.relation, action)
    }

    /**
     * Returns instance of query builder
     */
    public query(): any {
        return MorphManyQueryClient.query(this.client, this.relation, this.parent)
    }

    /**
     * Save related model instance
     */
    public async save(related: LucidRow) {
        await managedTransaction(this.parent.$trx || this.client, async (trx) => {
            this.parent.$trx = trx
            await this.parent.save()

            related[this.relation.foreignKey] = this.getForeignKeyValue(this.parent, 'save')
            related[this.relation.morphType] = this.relation.getMorphClass(this.relation.model);
            related.$trx = trx
            await related.save()
        })
    }

    /**
     * Save related model instance
     */
    public async saveMany(related: LucidRow[]) {
        const parent = this.parent

        await managedTransaction(this.parent.$trx || this.client, async (trx) => {
            this.parent.$trx = trx
            await parent.save()

            const foreignKeyValue = this.getForeignKeyValue(parent, 'saveMany')
            const type = this.relation.getMorphClass(this.relation.model);

            for( let row of related ) {
                row[this.relation.foreignKey] = foreignKeyValue
                row[this.relation.morphType] = type;

                row.$trx = trx
                await row.save()
            }
        })
    }

    /**
     * Create instance of the related model
     */
    public async create(values: ModelObject): Promise<LucidRow> {
        return managedTransaction(this.parent.$trx || this.client, async (trx) => {
            this.parent.$trx = trx
            await this.parent.save()

            return this.relation.relatedModel().create(Object.assign({
                [this.relation.foreignKey]: this.getForeignKeyValue(this.parent, 'create'),
                [this.relation.morphType]: this.relation.getMorphClass(this.relation.model)
            }, values), { client: trx })
        })
    }

    /**
     * Create instance of the related model
     */
    public async createMany(values: ModelObject[]): Promise<LucidRow[]> {
        const parent = this.parent

        return managedTransaction(this.parent.$trx || this.client, async (trx) => {
            this.parent.$trx = trx
            await parent.save()

            const foreignKeyValue = this.getForeignKeyValue(parent, 'createMany')
            const type = this.relation.getMorphClass(this.relation.model);
            return this.relation.relatedModel().createMany(values.map((value) => {
                return Object.assign({
                    [this.relation.foreignKey]: foreignKeyValue,
                    [this.relation.morphType]: type
                }, value)
            }), { client: trx })
        })
    }

    /**
     * Get the first matching related instance or create a new one
     */
    public async firstOrCreate(search: any, savePayload?: any): Promise<LucidRow> {
        return managedTransaction(this.parent.$trx || this.client, async (trx) => {
            this.parent.$trx = trx
            await this.parent.save()

            return this.relation.relatedModel().firstOrCreate(Object.assign({
                [this.relation.foreignKey]: this.getForeignKeyValue(this.parent, 'firstOrCreate'),
                [this.relation.morphType]: this.relation.getMorphClass(this.relation.model)
            }, search), savePayload, { client: trx })
        })
    }

    /**
     * Update the existing row or create a new one
     */
    public async updateOrCreate(
        search: ModelObject,
        updatePayload: ModelObject
    ): Promise<LucidRow> {
        return managedTransaction(this.parent.$trx || this.client, async (trx) => {
            this.parent.$trx = trx
            await this.parent.save()

            return this.relation.relatedModel().updateOrCreate(Object.assign({
                [this.relation.foreignKey]: this.getForeignKeyValue(this.parent, 'updateOrCreate'),
                [this.relation.morphType]: this.relation.getMorphClass(this.relation.model)
            }, search), updatePayload, { client: trx })
        })
    }
}
