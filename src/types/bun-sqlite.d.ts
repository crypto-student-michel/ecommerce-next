declare module "bun:sqlite" {
  export class Database {
    exec(arg0: string) {
      throw new Error("Method not implemented.");
    }
    query(arg0: string) {
      throw new Error("Method not implemented.");
    }
    constructor(filename?: string, options?: any);

    run(query: string, params?: any): any;

    prepare(query: string): {
      run(...params: any[]): any;
      get(...params: any[]): any;
      all(...params: any[]): any;
    };

    close(): void;
  }
}
