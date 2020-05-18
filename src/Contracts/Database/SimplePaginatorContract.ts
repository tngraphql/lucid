/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:57 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { SimplePaginatorMeta } from './SimplePaginatorMeta';

/**
 * Shape of the simple paginator that works with offset and limit
 */
export interface SimplePaginatorContract<Result extends any[]> {
    all(): Result

    readonly firstPage: number
    readonly perPage: number
    readonly currentPage: number
    readonly lastPage: number
    readonly hasPages: boolean
    readonly hasMorePages: boolean
    readonly isEmpty: boolean
    readonly total: number
    readonly hasTotal: boolean

    baseUrl(url: string): this

    queryString(values: { [key: string]: any }): this

    getUrl(page: number): string

    getMeta(): SimplePaginatorMeta

    getNextPageUrl(): string | null

    getPreviousPageUrl(): string | null

    getUrlsForRange(start: number, end: number): { url: string, page: number }[]

    toJSON(): { meta: SimplePaginatorMeta, data: Result }
}
