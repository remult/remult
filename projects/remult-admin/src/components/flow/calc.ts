import { Repository } from '../../../../core'
import { EntityUIInfo } from '../../../../core/server/remult-admin'

export const calcOptimisedDefaultPlacement = (
  tables: (EntityUIInfo & { repo: Repository<unknown> })[],
) => {
  const numColumns = 8
  const tableWidth = 250
  const rowHeight = 32
  const tableHeightSpace = 350
  const columns = Array(numColumns).fill(0) // Initialize column heights
  const maxCanvasHeight = Math.max(...columns) // Calculate the max column height
  let tablePositions: any[] = []

  // god.tables.sort((a, b) => a.key.localeCompare(b.key))
  // Sort entities by height (number of rows + 1 for the title)
  // if (algo === 'one') {
  // 	entities.sort((a, b) => b.meta.colsMeta.length + 1 - (a.meta.colsMeta.length + 1))
  // }
  // Maybe the one with no relation should be more on the right

  let isLeft = true

  // First pass: Place tables and calculate column heights
  for (let table of tables) {
    let tableHeight = (table.fields.length + 1) * rowHeight + tableHeightSpace
    const mins = Math.min(...columns)
    let columnIndex = isLeft ? columns.indexOf(mins) : columns.lastIndexOf(mins)
    // To alterna big tables
    // columns.filter((c) => c === mins).length > 1
    //   ? (isLeft = !isLeft)
    //   : (isLeft = isLeft)

    // Store table positions temporarily
    tablePositions.push({
      table,
      columnIndex: columnIndex,
      startY: columns[columnIndex],
      height: tableHeight,
    })

    // Update column height
    columns[columnIndex] += tableHeight
  }

  // Calculate the maximum column height
  const maxColumnHeight = Math.max(...columns)

  // Second pass: Adjust y position to center tables in each column
  tablePositions.forEach((position) => {
    const columnHeight = columns[position.columnIndex]
    const extraSpace = maxColumnHeight - columnHeight
    const numTables = tablePositions.filter(
      (pos) => pos.columnIndex === position.columnIndex,
    ).length
    const extraSpacePerTable = extraSpace / (numTables + 1)
    let cumulativeExtraSpace = extraSpacePerTable

    position.table.position = {
      x: position.columnIndex * tableWidth,
      y: position.startY + cumulativeExtraSpace,
    }

    // Update cumulative extra space for next table in the same column
    cumulativeExtraSpace += extraSpacePerTable + position.height
  })

  return tablePositions.map((pos) => {
    return { table: pos.table, position: pos.table.position }
  })
}
