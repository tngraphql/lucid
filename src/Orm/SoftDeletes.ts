/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/15/2020
 * Time: 12:06 PM
 */
import {SoftDeletingScope} from "./SoftDeletingScope";
import {LucidModel} from "../Contracts/Model/LucidModel";
import {LucidRow} from "../Contracts/Model/LucidRow";
import {BaseModel} from "./BaseModel/BaseModel";
import {DateTime} from "luxon";
import {DATE_TIME_TYPES} from "./Decorators/date";

class SoftDeletes {

    protected _forceDeleting = false;

    /**
     * Boot the soft deleting trait for a model.
     *
     */
    public static bootSoftDeletes() {
        // @ts-ignore
        this.addGlobalScope(new SoftDeletingScope());
    }

    /**
     * Force a hard delete on a soft deleted model.
     *
     */
    public async forceDelete() {
        this._forceDeleting = true;

        return this.performDeleteOnModel().then(x => {
            this._forceDeleting = false;

            return x;
        });
    }

    /**
     * Perform the actual delete query on this model instance.
     *
     */
    protected performDeleteOnModel() {
        const Model = this.constructor as LucidModel;
        const that = this as any | BaseModel;

        if (this._forceDeleting) {
            return this.newModelQuery().where(Model.primaryKey, that.$getAttribute(Model.primaryKey)).forceDelete();
        }

        return this.runSoftDelete();
    }

    /**
     * Perform the actual delete query on this model instance.
     */
    protected runSoftDelete() {
        const Model = this.constructor as LucidModel;

        // @ts-ignore
        const query = this.newModelQuery();

        query.where(Model.primaryKey, this.$getAttribute(Model.primaryKey));

        const time = DateTime.local();

        const columns = {
            [this.getDeletedAtColumn()]: time
        }

        this[this.getDeletedAtColumn()] = time;

        Model.$columnsDefinitions.forEach((column, attributeName) => {
            const columnType = column.meta?.type

            /**
             * Return early when not dealing with date time columns
             */
            if (!columnType || !DATE_TIME_TYPES[columnType] || !column.meta.autoUpdate) {
                return
            }

            const time = DateTime.local()

            columns[attributeName] = time;

            this[attributeName] = time;
        })

        return query.update(this.prepareForAdapter(columns));
    }

    /**
     * Restore a soft-deleted model instance.
     */
    public async restore() {
        const Model = this.constructor as LucidModel;
        await Model.$hooks.exec('before', 'restore', this);

        this[this.getDeletedAtColumn()] = null;

        const result = await this.save();

        await Model.$hooks.exec('after', 'restore', this);

        return result;
    }

    /**
     * Determine if the model instance has been soft-deleted.
     */
    public trashed() {
        return !!this[this.getDeletedAtColumn()];
    }

    /**
     * Determine if the model is currently force deleting.
     */
    public isForceDeleting(): boolean {
        return this._forceDeleting;
    }

    /**
     * Get the name of the "deleted at" column.
     *
     */
    public static getDeletedAtColumn() {
        // @ts-ignore
        return this.DELETED_AT || 'deletedAt';
    }

    /**
     * Get the name of the "deleted at" column.
     */
    public getDeletedAtColumn() {
        const Model = this.constructor as typeof SoftDeletes;

        return Model.getDeletedAtColumn();
    }

    /**
     * Get the fully qualified "deleted at" column.
     *
     */
    public static getQualifiedDeletedAtColumn() {
        // @ts-ignore
        return this.qualifyColumn(this.getDeletedAtColumn());
    }
}

interface SoftDeletes extends LucidRow {

}

export {SoftDeletes};