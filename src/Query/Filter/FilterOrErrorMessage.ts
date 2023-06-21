import { ObjectOrErrorMessage } from '../ObjectOrErrorMessage';
import type { Filter, FilterFunction } from './Filter';

/**
 * A class which stores one of:
 * - The original instruction string - a line from a tasks code block
 * - An optional {@link Filter}
 * - An optional error message
 *
 * This is really currently a convenience for returning data from
 * {@link Field.createFilterOrErrorMessage()} and derived classes.
 *
 * By the time the code has finished with parsing the line, typically the
 * contained {@link Filter} will be saved, for later use in searching for Tasks
 * that match the user's filter instruction.
 */
export class FilterOrErrorMessage {
    public object: ObjectOrErrorMessage<Filter>;

    private constructor(object: ObjectOrErrorMessage<Filter>) {
        this.object = object;
    }

    public get instruction(): string {
        return this.object.instruction;
    }

    public get filter(): Filter | undefined {
        return this.object.object;
    }

    public get error(): string | undefined {
        return this.object.error;
    }

    get filterFunction(): FilterFunction | undefined {
        if (this.filter) {
            return this.filter.filterFunction;
        } else {
            return undefined;
        }
    }

    /**
     * Construct a FilterOrErrorMessage with the filter.
     *
     * This function allows a meaningful {@link Explanation} to be supplied.
     *
     * @param filter - a {@link Filter}
     */
    public static fromFilter(filter: Filter): FilterOrErrorMessage {
        return new FilterOrErrorMessage(ObjectOrErrorMessage.fromObject<Filter>(filter.instruction, filter));
    }

    /**
     * Construct a FilterOrErrorMessage with the given error message.
     * @param instruction
     * @param errorMessage
     */
    public static fromError(instruction: string, errorMessage: string): FilterOrErrorMessage {
        return new FilterOrErrorMessage(ObjectOrErrorMessage.fromError<Filter>(instruction, errorMessage));
    }
}
