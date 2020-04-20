/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ModelObject } from '../../Contracts/Model/LucidRow';
import { ModelKeysContract } from '../../Contracts/Model/ModelKeysContract';

/**
 * Exposes the API to collect, get and resolve model keys
 */
export class ModelKeys implements ModelKeysContract {
    private keys: ModelObject = {}

    /**
     * Add a new key
     */
    public add(key: string, value: string) {
        this.keys[key] = value
    }

    /**
     * Get value for a given key
     */
    public get(key: string, defaultValue: string): string
    public get(key: string, defaultValue?: string): string | undefined {
        return this.keys[key] || defaultValue
    }

    /**
     * Resolve key, if unable to resolve, the key will be
     * returned as it is.
     */
    public resolve(key: string): string {
        return this.get(key, key)
    }

    /**
     * Return all keys
     */
    public all() {
        return this.keys
    }
}
