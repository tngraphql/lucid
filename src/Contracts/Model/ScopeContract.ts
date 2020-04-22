/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/22/2020
 * Time: 6:40 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { LucidModel } from './LucidModel';
import { ModelQueryBuilderContract } from './ModelQueryBuilderContract';

export interface ScopeContract {

    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * @param builder
     * @param model
     */
    apply(builder: ModelQueryBuilderContract<LucidModel>, model: LucidModel): void;
}
