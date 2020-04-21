/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/21/2020
 * Time: 5:59 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { EventEmitter } from 'events';

export class ModelEvent extends EventEmitter {

}

const modelEvent = new ModelEvent();
export { modelEvent };
