export interface DbRow {
  text: string;
  embedding: number[];
}

export interface DbCache {
  db: DbRow[];
  text: string;
}
