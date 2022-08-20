import type { StringMatcher } from './StringMatcher';

export class RegexMatcher implements StringMatcher {
    private readonly regex: RegExp;

    constructor(regex: RegExp) {
        this.regex = regex;
    }

    static validateAndStruct(regexInput: string): RegexMatcher | null {
        // Courtesy of https://stackoverflow.com/questions/17843691/javascript-regex-to-match-a-regex
        const regexPattern =
            /\/((?![*+?])(?:[^\r\n[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*])+)\/((?:g(?:im?|mi?)?|i(?:gm?|mg?)?|m(?:gi?|ig?)?)?)/;
        const query = regexInput.match(regexPattern);

        if (query !== null) {
            const regExp = new RegExp(query[1], query[2]);
            return new RegexMatcher(regExp);
        } else {
            return null;
        }
    }

    public matches(stringToSearch: string): boolean {
        return stringToSearch.match(this.regex) !== null;
    }
}
