import React from "react";
import "./index.css";
import {
  Column,
  Table,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  type ContainsStringValueFilter,
  type ComparisonValueFilter,
  type Repository,
  getValueList,
} from "remult";
import {
  useRemultReactTableServerSidePagingSortingAndFiltering,
  type RemultReactTableProps,
} from "./useRemultReactTable.ts";

export function ReactTable<entityType>({
  table,
}: {
  table: Table<entityType>;
}) {
  const rerender = React.useReducer(() => ({}), {})[1];
  return (
    <div className="p-2">
      <div className="h-2" />
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <>
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div>{table.getPrePaginationRowModel().rows.length} Rows</div>
      <div>
        <button onClick={() => rerender()}>Force Rerender</button>
      </div>

      <pre>{JSON.stringify(table.getState(), null, 2)}</pre>
    </div>
  );
}

export function useRemultReactTable<entityType>(
  repo: Repository<entityType>,
  props?: RemultReactTableProps<entityType>
) {
  const {
    columns,
    data,
    rowCount,
    state,
    onColumnFiltersChange,
    onPaginationChange,
    onSortingChange,
  } = useRemultReactTableServerSidePagingSortingAndFiltering(repo, props);

  return useReactTable({
    data,
    columns,
    rowCount,
    state,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
  });
}

function Filter({
  column,
  table,
}: {
  column: Column<any, unknown>;
  table: Table<any>;
}) {
  const columnFilterValue = (column.getFilterValue() as any[])?.[0];
  function setColumnFilterValue(filter: any) {
    column.setFilterValue(filter ? [filter] : undefined);
  }
  const isNumber = column.columnDef.meta?.field?.valueType === Number;
  const valueList = React.useMemo(() => {
    if (!column.columnDef.meta?.field) return undefined;
    const result = getValueList(column.columnDef.meta?.field);
    if (result) {
      if (typeof result[0] != "object") {
        return result.map((x) => ({ id: x, caption: x }));
      }
    }
    return result;
  }, []);

  if (valueList) {
    return (
      <select
        value={columnFilterValue ?? ""}
        onChange={(e) => setColumnFilterValue(e.target.value || undefined)}
      >
        <option value="">All</option>
        {valueList.map((x) => (
          <option key={x.id} value={x.id}>
            {x.caption}
          </option>
        ))}
      </select>
    );
  }

  if (isNumber) {
    type NumberFilterValue = Pick<
      ComparisonValueFilter<number>,
      "$gte" | "$lte"
    >;
    const filterValue = columnFilterValue as NumberFilterValue;
    function setFilter(filter: NumberFilterValue) {
      filter = { ...filterValue, ...filter };
      if (filter.$gte === undefined && filter.$lte === undefined) {
        setColumnFilterValue(undefined);
      } else {
        setColumnFilterValue(filter);
      }
    }
    return (
      <div>
        <div className="flex space-x-2">
          <DebouncedInput
            type="number"
            value={filterValue?.$gte ?? ""}
            onChange={(value) =>
              setFilter({ $gte: value ? +value : undefined })
            }
            placeholder={`Min `}
            className="w-24 border shadow rounded"
          />
          <DebouncedInput
            type="number"
            value={filterValue?.$lte ?? ""}
            onChange={(value) =>
              setFilter({ $lte: value ? +value : undefined })
            }
            placeholder={`Max`}
            className="w-24 border shadow rounded"
          />
        </div>
        <div className="h-1" />
      </div>
    );
  }

  return (
    <>
      <DebouncedInput
        type="text"
        value={
          typeof columnFilterValue === "number"
            ? (columnFilterValue as number)
            : (((columnFilterValue as ContainsStringValueFilter)?.$contains ??
                "") as string)
        }
        onChange={(value) =>
          setColumnFilterValue(
            value &&
              (isNumber
                ? value
                : ({ $contains: value } as ContainsStringValueFilter))
          )
        }
        placeholder={`Search... `}
        className="w-36 border shadow rounded"
        list={column.id + "list"}
      />
      <div className="h-1" />
    </>
  );
}

// A debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
