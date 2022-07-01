import type { Task } from '../../Task';
import { Field } from './Field';
import { FilterOrErrorMessage } from './Filter';

/**
 * TextField is an abstract base class to help implement
 * all the filter instructions that act on a single type of string
 * value, such as the description or file path.
 */
export abstract class TextField extends Field {
    private static readonly regexpPattern = /^\/(.*)\/$/;

    public createFilterOrErrorMessage(line: string): FilterOrErrorMessage {
        const result = new FilterOrErrorMessage();
        const match = Field.getMatch(this.filterRegexp(), line);
        if (match !== null) {
            const filterMethod = match[1];
            if (filterMethod === 'includes') {
                const queryString = match[2];
                const regexpMatch = queryString.match(TextField.regexpPattern);
                if (regexpMatch !== null) {
                    const pattern = regexpMatch[1];
                    const regexp = new RegExp(pattern);
                    result.filter = (task: Task) =>
                        this.value(task).match(regexp) !== null;
                } else {
                    result.filter = (task: Task) =>
                        TextField.stringIncludesCaseInsensitive(
                            this.value(task),
                            match[2],
                        );
                }
            } else if (match[1] === 'does not include') {
                result.filter = (task: Task) =>
                    !TextField.stringIncludesCaseInsensitive(
                        this.value(task),
                        match[2],
                    );
            } else {
                result.error = `do not understand query filter (${this.fieldName()})`;
            }
        } else {
            result.error = `do not understand query filter (${this.fieldName()})`;
        }
        return result;
    }

    public static stringIncludesCaseInsensitive(
        haystack: string,
        needle: string,
    ): boolean {
        return haystack
            .toLocaleLowerCase()
            .includes(needle.toLocaleLowerCase());
    }

    protected abstract filterRegexp(): RegExp | null;

    protected abstract fieldName(): string;

    /**
     * Returns the field's value, or an empty string if the value is null
     * @param task
     * @protected
     */
    protected abstract value(task: Task): string;
}
