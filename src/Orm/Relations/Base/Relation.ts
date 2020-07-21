/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/21/2020
 * Time: 3:10 PM
 */
import {RelationQueryBuilderContract} from "../../../Contracts/Orm/Relations/RelationQueryBuilderContract";

export class Relation {
    public async getEager(query: RelationQueryBuilderContract<any, any>) {
        return await query.selectRelationKeys().exec();
    }
}