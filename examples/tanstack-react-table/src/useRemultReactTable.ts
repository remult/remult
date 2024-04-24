import {
  type AccessorColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import React, { useEffect, useMemo } from "react";
import type {
  EntityFilter,
  EntityOrderBy,
  FieldMetadata,
  Repository,
  ValueFilter,
} from "remult";
export type RemultReactTableProps<entityType> = {
  fixedWhere?: EntityFilter<entityType>;

  columns?: {
    build: (props: {
      build: (
        fields: (string & keyof entityType)[]
      ) => AccessorColumnDef<entityType, any>[];
    }) => AccessorColumnDef<entityType, any>[];
    deps?: React.DependencyList;
  };
};

export function useRemultReactTableServerSidePagingSortingAndFiltering<
  entityType
>(repo: Repository<entityType>, props?: RemultReactTableProps<entityType>) {
  const columns = useMemo(
    () =>
      props?.columns?.build({
        build: (fields) => buildColumns(repo, fields),
      }) ??
      buildColumns(
        repo,
        repo.fields
          .toArray()
          .filter((f) => f.key != "id")
          .map((f) => f.key) as any
      ),
    props?.columns?.deps ?? []
  );
  const [columnFilters, onColumnFiltersChange] =
    React.useState<ColumnFiltersState>([]);
  const [data, setData] = React.useState<entityType[]>([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [{ pageIndex, pageSize }, onPaginationChange] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
  const [sorting, onSortingChange] = React.useState<SortingState>([]);
  const where = React.useMemo(() => {
    console.log("filterArray", columnFilters);
    const where: EntityFilter<entityType> = {};
    for (const { id, value } of columnFilters) {
      //@ts-expect-error typing unknown stuff
      where[id] = value?.[0] as ValueFilter<any>;
    }
    return { $and: [where, props?.fixedWhere!] } as EntityFilter<entityType>;
  }, [JSON.stringify(columnFilters)]);

  useEffect(() => {
    const r = repo;
    r.count(where).then(setRowCount);
  }, [where]);
  useEffect(() => {
    const orderBy: EntityOrderBy<entityType> = {};
    for (const sort of sorting) {
      //@ts-expect-error typing unknown stuff
      orderBy[sort.id as keyof entityType] = sort.desc ? "desc" : "asc";
    }

    repo
      .find({
        orderBy,
        where,
        limit: pageSize,
        page: pageIndex + 1,
      })
      .then((x) => setData(() => x));
  }, [pageIndex, pageSize, sorting, where]);
  return {
    data,
    columns,
    rowCount,
    state: {
      columnFilters,
      sorting,
      pagination: { pageIndex, pageSize },
    },
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
  };
}
function buildColumns<entityType>(
  repo: Repository<entityType>,
  fields: (string & keyof entityType)[]
): AccessorColumnDef<entityType, any>[] {
  return fields.map((field) => {
    const fieldMeta = repo.fields.find(field);
    return {
      accessorKey: field,
      header: fieldMeta.caption,
      cell: (info) => info.getValue(),
      meta: {
        field: fieldMeta,
      },
    };
  });
}

import "@tanstack/react-table"; //or vue, svelte, solid, qwik, etc.

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    field?: FieldMetadata<TData, TValue>;
  }
}
