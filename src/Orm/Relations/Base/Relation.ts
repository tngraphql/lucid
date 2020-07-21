/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/21/2020
 * Time: 12:02 PM
 */

export abstract class Relation {
    constructor() {

        this.addConstraints();
    }

    abstract addConstraints();

    abstract initRelation();

    abstract getEager();
}