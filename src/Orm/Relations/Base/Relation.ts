/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/21/2020
 * Time: 3:10 PM
 */
import {RelationQueryBuilderContract} from "../../../Contracts/Orm/Relations/RelationQueryBuilderContract";
import {LucidModel} from "../../../Contracts/Model/LucidModel";
export const MORPH_METADATA_KEY = Symbol('morph:map');

export class Relation {
    public relatedModel: any;

    public async getEager(query: RelationQueryBuilderContract<any, any>) {
        return await query.selectRelationKeys().exec();
    }

    public morphMap() {
        return Reflect.getMetadata(MORPH_METADATA_KEY, this.relatedModel());
    }

    public getActualClassNameForMorph(type) {
        return this.morphMap()[type]();
    }

    public getMorphClass(model: LucidModel): string {
        const morphMap: any = Object.entries(this.morphMap());

        for (const [type, morphClass] of morphMap) {
            if (morphClass() === model) {
                return type;
            }
        }

        return model.name;
    }
}