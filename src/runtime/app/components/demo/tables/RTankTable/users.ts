import { defineEventHandler, getQuery, readBody } from 'h3'
import { queryUsers, type UserQuery } from '~~/shared/demo-users'

/**
 * Mock backend for the OCTable API demo. Accepts the params as a query string (GET) or a JSON body (POST).
 *
 * Response shape (exercises every response rule of OCTable):
 *   - `SelectAllIds`  -> read first, because the demo passes select-all-pk="SelectAllIds"
 *   - `Result`        -> unwrapped by api.where = 'Result'
 *   - `Result.dataSrc`-> unwrapped again by OCTable
 *   - `RecordCount`   -> total, read from the first row
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const body = event.method === 'GET' ? {} : await readBody(event).catch(() => ({}))
  const raw = { ...query, ...(body ?? {}) } as Record<string, unknown>

  const params: UserQuery = {
    Pages: Number(raw.Pages) || undefined,
    Records: Number(raw.Records) || undefined,
    Search: typeof raw.Search === 'string' ? raw.Search : '',
    OrderBy: typeof raw.OrderBy === 'string' ? raw.OrderBy : undefined,
    OrderDir: raw.OrderDir === 'DESC' ? 'DESC' : 'ASC',
    department: typeof raw.department === 'string' ? raw.department : undefined,
  }

  const { total, ids, rows } = queryUsers(params)

  await new Promise((resolve) => setTimeout(resolve, 350)) // make the loading state visible

  return {
    SelectAllIds: ids,
    Result: { dataSrc: rows.map((row) => ({ ...row, RecordCount: total })) },
  }
})
