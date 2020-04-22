import { LucidModel } from './Model/LucidModel';
import { ModelQueryBuilderContract } from './Model/ModelQueryBuilderContract';

/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/22/20
 * Time: 3:50 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export interface Ctor<T = any> {
    new(...args: any[]): T
}

export type ScopeType = string | ((builder: ModelQueryBuilderContract<LucidModel>) => any) | object;
