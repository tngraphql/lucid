/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 5/7/2020
 * Time: 5:07 PM
 */
import {ISOLATION_LEVELS} from "../../Database/customTransaction";
import {TransactionClientContract} from "./TransactionClientContract";

/**
 * Options provided when the transaction is created
 */
export interface TransactionOptions {
    isolationLevel?: ISOLATION_LEVELS;

    /**
     * Parent transaction.
     */
    transaction?: TransactionClientContract;
}