import { QueryClientContract } from '../Contracts/Database/QueryClientContract';

/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 5/3/2020
 * Time: 9:18 AM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export class AbstractDialect {
    public readonly settingIsolationLevelDuringTransaction: boolean = true;

    constructor(protected client: QueryClientContract) {
    }

    setIsolationLevelQuery(value) {
        return `SET TRANSACTION ISOLATION LEVEL ${ value };`;
    }
}
