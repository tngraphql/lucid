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
    static $selfJoinCount = 0;

    public relatedModel: any;

    public async getEager(query: RelationQueryBuilderContract<any, any>) {
        return await query.selectRelationKeys().exec();
    }

    public static morphMap(map: {[key: string]: () => LucidModel}): void {
        Reflect.defineMetadata(MORPH_METADATA_KEY, map, this);
    }

    public getMorphMap() {
        return Reflect.getMetadata(MORPH_METADATA_KEY, Relation) || {};
    }

    public getActualClassNameForMorph(type) {
        return this.getMorphMap()[type]();
    }

    public getMorphClass(model: LucidModel): string {
        const morphMap: any = Object.entries(this.getMorphMap());

        for (const [type, morphClass] of morphMap) {
            if (morphClass() === model) {
                return type;
            }
        }

        return model.name;
    }
}