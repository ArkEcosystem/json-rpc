import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";
import sql from "sql";

class Database {
    private database: BetterSqlite3.Database;
    private table: any;

    public connect(file: string) {
        ensureFileSync(file);

        this.database = new BetterSqlite3(file);

        sql.setDialect("sqlite");

        // @ts-ignore
        this.table = sql.define({
            columns: [
                {
                    dataType: `VARCHAR(255)`,
                    name: "key",
                    primaryKey: true,
                },
                {
                    dataType: "TEXT",
                    name: "value",
                },
            ],
            name: "keyv",
        });

        this.database.exec(
            this.table
                .create()
                .ifNotExists()
                .toString(),
        );
    }

    public async get<T = any>(key: string): Promise<T> {
        const row = this.database
            .prepare(
                this.table
                    .select(this.table.value)
                    .where({ key: this.getKeyPrefix(key) })
                    .toString(),
            )
            .get();

        if (!row) {
            return undefined;
        }

        try {
            return JSON.parse(row.value);
        } catch (err) {
            return row.value;
        }
    }

    public async set<T = any>(key: string, value: T): Promise<void> {
        this.database.exec(this.table.replace({ key: this.getKeyPrefix(key), value }).toString());
    }

    private getKeyPrefix(key: string): string {
        return `keyv:${key}`;
    }
}

export const database = new Database();
