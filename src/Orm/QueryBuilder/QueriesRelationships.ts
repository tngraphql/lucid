/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/27/2020
 * Time: 9:28 PM
 */
import {QueriesRelationshipsContract} from "./QueriesRelationshipsContract";
import {ModelQueryBuilder} from "./ModelQueryBuilder";

class QueriesRelationships implements QueriesRelationshipsContract {
    /**
     * Add a relationship count / exists condition to the query.
     *
     * @param relation
     * @param operator
     * @param count
     * @param boolean
     * @param callback
     */
    public has(relation, operator = '>=', count = 1, boolean = 'and', callback = null) {
        if (relation.includes('.')) {
            return this.hasNested(relation, operator, count, boolean, callback);
        }

        relation = this.getRelation(relation);

        if (relation.constructor.name === 'MorphTo') {
            throw new Error('has() and whereHas() do not support MorphTo relationships.');
        }

        relation = this.getRelationWithoutConstraints(relation);

        const hasQuery = relation.query();

        this.canUseExistsForExistenceCheck(operator, count)
            ? hasQuery.getRelationExistenceQuery(hasQuery, this)
            : hasQuery.getRelationExistenceCountQuery(hasQuery, this)


        callback && callback(hasQuery);

        this.addHasWhere(hasQuery, relation, operator, count, boolean);

        return this;
    }

    protected getRelation(relationName: string) {
        return this.model.$getRelation(relationName) as any;
    }

    protected getRelationWithoutConstraints(relation) {
        relation!.boot();

        return relation.client(null, this.model.getConnection());
    }

    protected hasNested(relations, operator = '>=', count = 1, boolean = 'and', callback = null) {
        relations = relations.split('.');

        const doesntHave = operator === '<' && count === 1;

        if (doesntHave) {
            operator = '>=';
            count = 1;
        }

        const closure = function (q) {
            relations.length > 1
                ? q.whereHas(relations.shift(), closure)
                : q.has(relations.shift(), operator, count, 'and', callback)
        }

        return this.has(relations.shift(), doesntHave ? '<' : '>=', 1, boolean, closure);
    }

    public orHas(relation, operator = '>=', count = 1) {
        return this.has(relation, operator, count, 'or');
    }

    public doesntHave(relation, boolean = 'and', callback = null) {
        return this.has(relation, '<', 1, boolean, callback);
    }

    public orDoesntHave(relation) {
        return this.doesntHave(relation, 'or');
    }

    public whereHas(relation, callback = null, operator = '>=', count = 1) {
        return this.has(relation, operator, count, 'and', callback);
    }

    public orWhereHas(relation, callback = null, operator = '>=', count = 1) {
        return this.has(relation, operator, count, 'or', callback);
    }

    public whereDoesntHave(relation, callback = null) {
        return this.doesntHave(relation, 'and', callback);
    }

    public orWhereDoesntHave(relation, callback) {
        return this.doesntHave(relation, 'or', callback);
    }

    public withCount(relation, callback?) {
        if (!relation) {
            return this;
        }

        if (!this.knexQuery['_statements'].some(x => x.grouping === 'columns')) {
            this.select(this.qualifyColumn('*'));
        }

        let [name, alias] = relation.split(' as ');
        alias = alias ? alias : relation + '_count';

        relation = this.getRelation(relation);

        if (relation.constructor.name === 'MorphTo') {
            throw new Error('withCount() do not support MorphTo relationships.');
        }

        relation = this.getRelationWithoutConstraints(relation);

        const hasQuery = relation.query();

        hasQuery.getRelationExistenceCountQuery(hasQuery, this);

        callback && callback(hasQuery);

        this.selectSub(hasQuery, alias);

        return this;
    }

    public whereColumn(first, operator, second, boolean = 'and') {
        boolean = boolean.toLowerCase();
        const type = 'WhereRaw';
        return this[boolean + type](
            [first, operator, second].join(' ')
        )
    }

    protected addHasWhere(hasQuery, relation, operator = '>=', count = 1, boolean = 'and') {
        hasQuery.withoutGlobalScopes(hasQuery.removedScopes())
            .applyScopes();

        this.canUseExistsForExistenceCheck(operator, count)
            ? this.addWhereExistsQuery(hasQuery, boolean, operator === '<' && count === 1)
            : this.addWhereCountQuery(hasQuery, operator, count, boolean);
    }

    protected addWhereExistsQuery(query, boolean = 'and', not = false) {
        boolean = boolean.toLowerCase();

        const type = not ? 'WhereNotExists' : 'WhereExists';

        this[boolean + type](query);
    }

    protected addWhereCountQuery(query, operator = '>=', count = 1, boolean = 'and') {
        boolean = boolean.toLowerCase();

        const type = 'WhereRaw';

        const {sql, bindings} = query.toSQL();

        bindings.push(count);

        this[boolean + type](`(${sql}) ${operator} ?`, bindings);
    }

    protected canUseExistsForExistenceCheck(operator, count) {
        return (operator === '>=' || operator === '<') && count === 1;
    }
}

interface QueriesRelationships extends ModelQueryBuilder {

}

export {QueriesRelationships}