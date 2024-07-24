import sql from "mssql";

export let pool: sql.ConnectionPool;

export async function createPool(config: sql.config) {
  pool = await new sql.ConnectionPool({
    ...config
  }).connect();
}

export function createRequest(trans: sql.Transaction = null) {
  if (trans == null) {
    return pool.request();
  } else {
    return new sql.Request(trans);
  }
}
