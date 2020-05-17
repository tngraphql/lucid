/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 10:07 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { syncDiff } from '../src/utils';

describe('Utils | syncDiff', () => {
    test('return ids to be added', () => {
        const dbRows = {
            1: {
                id: '1',
                user_id: '1',
                skill_id: '1',
                score: 1,
            },
        }

        const idsToSync = {
            1: {},
            2: {},
            3: {},
        }

        const diff = syncDiff(dbRows, idsToSync)
        expect(diff).toEqual({
            added: { 2: {}, 3: {} },
            updated: {}
        })
    })

    test('return ids to be updated when attributes are different', () => {
        const dbRows = {
            1: {
                id: '1',
                user_id: '1',
                skill_id: '1',
                score: 1,
            },
        }

        const idsToSync = {
            1: {
                score: 4,
            },
            2: {},
            3: {},
        }

        const diff = syncDiff(dbRows, idsToSync)
        expect(diff).toEqual({
            added: { 2: {}, 3: {} },
            updated: {
                1: { score: 4 },
            }
        })
    })

    test('ignore rows whose attributes are same', () => {
        const dbRows = {
            1: {
                id: '1',
                user_id: '1',
                skill_id: '1',
                score: 1,
            },
        }

        const idsToSync = {
            1: {
                score: 1,
            },
            2: {
                score: 4,
            },
            3: {
                score: 4,
            },
        }

        const diff = syncDiff(dbRows, idsToSync)
        expect(diff).toEqual({
            added: {
                2: { score: 4 },
                3: { score: 4 },
            },
            updated: {}
        })
    })
})
