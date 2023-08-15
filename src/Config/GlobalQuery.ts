import { Query } from '../Query/Query';

export class GlobalQuery {
    private static instance: GlobalQuery;

    static empty = '';
    private _value = GlobalQuery.empty;

    public static getInstance(): GlobalQuery {
        if (!GlobalQuery.instance) {
            GlobalQuery.instance = new GlobalQuery();
        }

        return GlobalQuery.instance;
    }

    public new_set(value: string) {
        this._value = value;
    }

    public new_get() {
        return this._value;
    }

    public new_query(): Query {
        return new Query({ source: this._value });
    }

    static isEmpty(): boolean {
        return GlobalQuery.getInstance().new_get().trim() == GlobalQuery.empty;
    }

    static explainQuery(): string {
        return GlobalQuery.getInstance().new_query().explainQuery();
    }

    static reset() {
        GlobalQuery.getInstance().new_set(GlobalQuery.empty);
    }
}
