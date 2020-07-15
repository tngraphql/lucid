import {ScopeContract} from "../Contracts/Model/ScopeContract";
import {ModelQueryBuilderContract} from "../Contracts/Model/ModelQueryBuilderContract";
import {LucidModel} from "../Contracts/Model/LucidModel";
import {DateTime} from "luxon";
import {LucidRow} from "../Contracts/Model/LucidRow";

/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/15/2020
 * Time: 12:06 PM
 */

export class SoftDeletingScope implements ScopeContract {
    /**
     * All of the extensions to be added to the builder.
     *
     * @var array
     */
    protected _extensions = ['Restore', 'WithTrashed', 'WithoutTrashed', 'OnlyTrashed'];

    public apply(builder: ModelQueryBuilderContract<LucidModel>, model: any): void {
        builder.whereNull(model.getQualifiedDeletedAtColumn());
    }

    public extend(builder: ModelQueryBuilderContract<LucidModel>) {
        for (const extension of this._extensions) {
            this[`add${extension}`](builder);
        }

        builder.onDelete(builder => {
            const column = this.getDeletedAtColumn(builder);

            builder.update({
                [column]: DateTime.local()
            });
        });
    }

    /**
     * Get the "deleted at" column for the builder.
     *
     */
    protected getDeletedAtColumn(builder: ModelQueryBuilderContract<LucidModel>): string {
        // @ts-ignore
        return builder.model.getQualifiedDeletedAtColumn();
    }

    /**
     * Add the restore extension to the builder.
     *
     * @param builder
     */
    protected addRestore(builder) {
        builder.restore = () => {
            builder.withTrashed();

            return builder.update({[builder.model.getDeletedAtColumn()]: null});
        }
    }

    /**
     * Add the with-trashed extension to the builder.
     *
     * @param builder
     */
    protected addWithTrashed(builder) {
        builder.withTrashed = (withTrashed = true) => {
            if (!withTrashed) {
                return builder.withoutTrashed();
            }

            return builder.withoutGlobalScope(this.constructor);
        }
    }

    /**
     * Add the without-trashed extension to the builder.
     *
     * @param builder
     */
    protected addWithoutTrashed(builder) {
        builder.withoutTrashed = () => {
            const model = builder.model;

            builder.withoutGlobalScope(this.constructor).whereNull(
                model.getQualifiedDeletedAtColumn()
            );

            return builder;
        }
    }

    /**
     * Add the only-trashed extension to the builder.
     *
     * @param builder
     */
    public addOnlyTrashed(builder) {
        builder.onlyTrashed = () => {
            const model = builder.model;

            builder.withoutGlobalScope(this.constructor).whereNotNull(
                model.getQualifiedDeletedAtColumn()
            );

            return builder;
        }
    }
}