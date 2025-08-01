<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import FieldBuilder from './FieldBuilder.vue'
import SelectDropdown from './SelectDropdown.vue'
import RemovableFrame from './RemovableFrame.vue'
import Code from '../../components/homepage/Code.vue'
import Button from './Button.vue'
import OptionsRenderer from './OptionsRenderer.vue'

interface RemultField {
  id: string
  name: string
  type: string
  options: Record<string, any>
}

const className = ref('Task')
const entityOptions = ref({
  label: '',
  dbName: '',
  sqlExpression: false,
})

// Define available options for entity (same structure as FieldBuilder)
const entityAvailableOptions = [
  {
    key: 'label',
    type: 'string' as const,
    label: 'Label',
    description: 'Display label for the entity',
  },
  {
    key: 'dbName',
    type: 'string' as const,
    label: 'DB Name',
    description: 'Database table name',
  },
  {
    key: 'sqlExpression',
    type: 'boolean' as const,
    label: 'SQL Expression',
    description: 'Based on SQL expression instead of table',
  },
]
const entityHooks = ref({
  validation: null,
  saving: null,
  saved: null,
  deleting: null,
  deleted: null,
})
const entityPermissions = ref({
  allowApiRead: null,
  allowApiInsert: null,
  allowApiUpdate: null,
  allowApiDelete: null,
  allowApiCrud: null,
})

// Permission options for the dropdown
const permissionOptions = [
  { value: true, label: 'Allow everyone', icon: '✓', color: 'green' },
  { value: false, label: 'Deny everyone', icon: '✗', color: 'red' },
  {
    value: 'Allow.authenticated',
    label: 'Authenticated users only',
    icon: '🔐',
    color: 'blue',
  },
  {
    value: 'admin',
    label: 'Users with role "admin"',
    icon: '👑',
    color: 'purple',
  },
  { value: 'user', label: 'Users with role "user"', icon: '👤', color: 'gray' },
  {
    value: 'currentUser',
    label: 'Current user only',
    icon: '🏠',
    color: 'orange',
  },
]

const availablePermissions = [
  { key: 'allowApiCrud', label: 'CRUD' },
  { key: 'allowApiUpdate', label: 'Update' },
  { key: 'allowApiDelete', label: 'Delete' },
  { key: 'allowApiInsert', label: 'Insert' },
  { key: 'allowApiRead', label: 'Read' },
]

// Hook options
const availableHooks = [
  { key: 'validation', label: 'Validation' },
  { key: 'saving', label: 'Saving' },
  { key: 'saved', label: 'Saved' },
  { key: 'deleting', label: 'Deleting' },
  { key: 'deleted', label: 'Deleted' },
]

// Hook implementation types
const hookImplementations = [
  { value: 'todo', label: 'TODO', icon: '🚧' },
  { value: 'custom', label: 'Custom code', icon: '⚙️' },
]
const showEntityOptions = ref(false)
// Initialize syncStateWithUrl from localStorage (default false)
const syncStateWithUrl = ref(
  typeof window !== 'undefined'
    ? localStorage.getItem('remultor-sync-url') === 'true'
    : false,
)
const fields = ref<RemultField[]>([
  {
    id: '1',
    name: 'id',
    type: 'id',
    options: {},
  },
  {
    id: '2',
    name: 'title',
    type: 'string',
    options: { required: true },
  },
])

// Auto-generate entity key from class name
const entityKey = computed(() => {
  return (
    className.value.replace(/([A-Z])/g, (match, letter, index) =>
      index === 0 ? letter.toLowerCase() : `-${letter.toLowerCase()}`,
    ) + 's'
  )
})

// Generate the complete Remult class code
const generatedCode = computed(() => {
  const imports = new Set<string>()
  const entityImports = new Set<string>()
  const fieldLines: string[] = []
  const preClassLines: string[] = []

  // Analyze fields to determine needed imports
  fields.value.forEach((field) => {
    if (['id', 'createdAt', 'updatedAt'].includes(field.type)) {
      imports.add('Fields')
    } else if (field.type === 'autoIncrement') {
      imports.add('Fields')
    } else if (
      [
        'string',
        'number',
        'integer',
        'boolean',
        'date',
        'dateOnly',
        'json',
        'object',
      ].includes(field.type)
    ) {
      imports.add('Fields')
    } else if (field.type === 'literal') {
      imports.add('Fields')
    } else if (field.type === 'list') {
      imports.add('Field')
      imports.add('ValueListFieldType')
    } else if (field.type === 'toOne' || field.type === 'toMany') {
      imports.add('Relations')
      // Add entity import for relations
      const entityName =
        field.options.entity || detectEntityFromFieldName(field.name)
      if (entityName && entityName !== 'Entity') {
        entityImports.add(entityName)
      }
    }
  })

  imports.add('Entity')

  // Check if we need to import remult for currentUser permissions
  const hasCurrentUserPermissions = Object.values(
    entityPermissions.value,
  ).includes('currentUser')
  if (hasCurrentUserPermissions) {
    imports.add('remult')
  }

  // Generate field decorators and properties
  fields.value.forEach((field) => {
    // Determine if field is required based on the checkbox value
    const isRequired = field.options.required === true

    // Format options for better readability, excluding required:false and defaultValue
    let optionsStr = ''
    const filteredOptions = Object.entries(field.options).filter(
      ([key, value]) => {
        if (key === 'required' && value === false) return false // Remove required:false as it's default
        if (key === 'defaultValue') return false // Remove defaultValue from decorator
        if (key === 'literalValues' || key === 'constName' || key === 'items')
          return false // These are handled specially
        if (key === 'sqlExpression') return false // Remove sqlExpression from options object
        return value !== undefined && value !== ''
      },
    )

    // Build options items array (key-value pairs and comments)
    const optionsItems: string[] = []

    // Add key-value pairs
    filteredOptions.forEach(([key, value]) => {
      if (typeof value === 'string') {
        optionsItems.push(`${key}: '${value}'`)
      } else {
        optionsItems.push(`${key}: ${value}`)
      }
    })

    // Add sqlExpression comment if enabled
    if (field.options.sqlExpression) {
      optionsItems.push(
        `// sqlExpression: ()=> \`SELECT id, name FROM employees
  //                 UNION ALL SELECT id, name FROM contractors\``,
      )
    }

    // Format based on total character length
    if (optionsItems.length > 0) {
      const totalLength = optionsItems.join(', ').length

      if (totalLength > 55 || field.options.sqlExpression) {
        // Multi-line format for long options
        const indentedItems = optionsItems
          .map((item) => `    ${item}`)
          .join(',\n')
        optionsStr = `({\n${indentedItems}\n  })`
      } else {
        // Single-line format for short options
        optionsStr = `({ ${optionsItems.join(', ')} })`
      }
    }

    // Handle special cases for literal and list
    if (field.type === 'literal' && field.options.literalValues) {
      // Auto-generate const name like value list (Pascal case of field name + 'Options')
      const constName = `${
        field.name.charAt(0).toUpperCase() + field.name.slice(1)
      }Options`
      const literals = field.options.literalValues
        .split(',')
        .map((v: string) => `'${v.trim()}'`)
        .join(', ')

      // Add const array and type definition before class
      preClassLines.push(`const ${constName} = [${literals}] as const`)
      preClassLines.push(
        `type ${
          field.name.charAt(0).toUpperCase() + field.name.slice(1)
        }Type = typeof ${constName}[number]`,
      )
      preClassLines.push('')

      optionsStr = `(() => ${constName})`
    } else if (field.type === 'list' && field.options.items) {
      // Auto-generate class name from field name in Pascal case
      const className = field.name.charAt(0).toUpperCase() + field.name.slice(1)
      const items =
        field.options.items ||
        'low:🔽 Low Priority,medium:⚡ Medium Priority,high:🔥 High Priority'

      // Generate ValueListFieldType class
      preClassLines.push(`@ValueListFieldType()`)
      preClassLines.push(`export class ${className} {`)

      // Generate static instances
      items.split(',').forEach((item: string) => {
        const [id, label] = item.split(':').map((s: string) => s.trim())
        if (id && label) {
          // Use the original ID for static property name and capitalize it for constructor
          const capitalizedId = id.toUpperCase()
          preClassLines.push(
            `  static ${id} = new ${className}('${capitalizedId}', '${label}')`,
          )
        }
      })

      preClassLines.push(`  constructor(`)
      preClassLines.push(`    public id: string,`)
      preClassLines.push(`    public label: string,`)
      preClassLines.push(`  ) {}`)
      preClassLines.push(`}`)
      preClassLines.push('')

      optionsStr = `(() => ${className})`
    } else if (field.type === 'toOne') {
      // Handle toOne relation
      const entityName =
        field.options.entity ||
        detectEntityFromFieldName(field.name) ||
        'Entity'
      const foreignKey = field.options.foreignKey

      // Build options object for the relation
      const relationOptions: string[] = []

      // Only add field option and foreign key field if foreign key is explicitly set
      if (foreignKey) {
        relationOptions.push(`field: '${foreignKey}'`)

        // Add the foreign key field before the relation
        fieldLines.push(`  @Fields.string()`)
        fieldLines.push(`  ${foreignKey} = ''`)
      }

      if (field.options.label) {
        relationOptions.push(`label: '${field.options.label}'`)
      }

      if (field.options.defaultIncluded === true) {
        relationOptions.push(`defaultIncluded: true`)
      }

      // Generate options string
      if (relationOptions.length > 0) {
        optionsStr = `(() => ${entityName}, { ${relationOptions.join(', ')} })`
      } else {
        optionsStr = `(() => ${entityName})`
      }
    } else if (field.type === 'toMany') {
      // Handle toMany relation
      const entityName =
        field.options.entity ||
        detectEntityFromFieldName(field.name) ||
        'Entity'
      const foreignKey = field.options.foreignKey

      // Build options object for the relation
      const relationOptions: string[] = []

      // Only add field option if foreign key is explicitly set
      if (foreignKey) {
        relationOptions.push(`field: '${foreignKey}'`)
      }

      if (field.options.label) {
        relationOptions.push(`label: '${field.options.label}'`)
      }

      if (field.options.defaultIncluded === true) {
        relationOptions.push(`defaultIncluded: true`)
      }

      // Generate options string
      if (relationOptions.length > 0) {
        optionsStr = `(() => ${entityName}, { ${relationOptions.join(', ')} })`
      } else {
        optionsStr = `(() => ${entityName})`
      }
    }

    // Always add parentheses if no options
    if (!optionsStr) {
      optionsStr = '()'
    }

    // Use appropriate decorator based on field type
    let decorator = ''
    if (field.type === 'list') {
      decorator = 'Field'
    } else if (field.type === 'toOne') {
      decorator = 'Relations.toOne'
    } else if (field.type === 'toMany') {
      decorator = 'Relations.toMany'
    } else {
      decorator = `Fields.${field.type}`
    }

    fieldLines.push(`  @${decorator}${optionsStr}`)

    // Determine TypeScript type
    let tsType = 'string'
    switch (field.type) {
      case 'number':
      case 'integer':
      case 'autoIncrement':
        tsType = 'number'
        break
      case 'boolean':
        tsType = 'boolean'
        break
      case 'date':
      case 'dateOnly':
      case 'createdAt':
      case 'updatedAt':
        tsType = 'Date'
        break
      case 'literal':
        // Use the generated type name
        tsType = `${
          field.name.charAt(0).toUpperCase() + field.name.slice(1)
        }Type`
        break
      case 'list':
        // Use the auto-generated class name (Pascal case of field name)
        tsType = field.name.charAt(0).toUpperCase() + field.name.slice(1)
        break
      case 'toOne':
        // Use the related entity name
        tsType = field.options.entity || 'any'
        break
      case 'toMany':
        // Use array of related entity name
        tsType = `${field.options.entity || 'any'}[]`
        break
      case 'json':
      case 'object':
        // Use custom type if provided, otherwise default to any
        tsType = field.options.type || 'any'
        break
    }

    const hasDefaultValue =
      field.options.defaultValue !== undefined &&
      field.options.defaultValue !== ''

    // Determine property syntax
    let propertyDeclaration = ''

    // Handle ID fields
    if (field.type === 'id') {
      if (field.options.allowNull === true) {
        propertyDeclaration = `  ${field.name}: string | null = null`
      } else {
        propertyDeclaration = `  ${field.name} = ''`
      }
    } else if (field.type === 'boolean') {
      // Boolean fields always default to false
      propertyDeclaration = `  ${field.name} = false`
    } else if (
      ['date', 'dateOnly', 'createdAt', 'updatedAt'].includes(field.type)
    ) {
      // Date fields always default to new Date()
      propertyDeclaration = `  ${field.name} = new Date()`
    } else if (hasDefaultValue) {
      // When there's a custom default value, use it and let TypeScript infer the type
      let defaultVal = field.options.defaultValue
      if (
        typeof defaultVal === 'string' &&
        !['json', 'object'].includes(field.type)
      ) {
        defaultVal = `'${defaultVal}'`
      }
      propertyDeclaration = `  ${field.name} = ${defaultVal}`
    } else if (field.type === 'literal' && field.options.literalValues) {
      // For literal types, use the first value as default
      const firstValue = field.options.literalValues.split(',')[0]?.trim()
      propertyDeclaration = `  ${field.name}: ${tsType} = '${firstValue}'`
    } else if (field.type === 'list' && field.options.items) {
      // For list types, use the first item as default
      const firstItemId = field.options.items
        .split(',')[0]
        ?.split(':')[0]
        ?.trim()
      const staticName = firstItemId || 'default'
      const className = field.name.charAt(0).toUpperCase() + field.name.slice(1)
      propertyDeclaration = `  ${field.name}: ${tsType} = ${className}.${staticName}`
    } else if (field.type === 'toOne') {
      // For toOne relations, use undefined as default
      propertyDeclaration = `  ${field.name}?: ${tsType}`
    } else if (field.type === 'toMany') {
      // For toMany relations, use empty array as default
      propertyDeclaration = `  ${field.name}: ${tsType} = []`
    } else if (field.type === 'autoIncrement') {
      // Auto increment fields
      propertyDeclaration = `  ${field.name}${
        isRequired ? '!' : '?'
      }: ${tsType}`
    } else {
      // Regular fields - handle allowNull and required cases
      if (field.options.allowNull === true) {
        // If allowNull is true, use nullable type with null default
        propertyDeclaration = `  ${field.name}: ${tsType} | null = null`
      } else if (isRequired) {
        // If required, use definite assignment assertion
        propertyDeclaration = `  ${field.name}!: ${tsType}`
      } else {
        // If not required, use default value
        if (tsType === 'string') {
          propertyDeclaration = `  ${field.name} = ''`
        } else if (tsType === 'number') {
          propertyDeclaration = `  ${field.name} = 0`
        } else if (tsType === 'boolean') {
          propertyDeclaration = `  ${field.name} = false`
        } else {
          propertyDeclaration = `  ${field.name}: ${tsType}`
        }
      }
    }

    fieldLines.push(propertyDeclaration)

    // Don't add empty line if this field is a foreign key for the next relation field
    const currentIndex = fields.value.findIndex((f) => f.id === field.id)
    const nextField = fields.value[currentIndex + 1]
    const isFollowedByRelationUsingThisField =
      nextField &&
      (nextField.type === 'toOne' || nextField.type === 'toMany') &&
      nextField.options.foreignKey === field.name

    if (!isFollowedByRelationUsingThisField) {
      fieldLines.push('')
    }
  })

  const preClassContent =
    preClassLines.length > 0 ? preClassLines.join('\n') + '\n' : ''

  // Build entity imports string
  const entityImportsStr =
    entityImports.size > 0
      ? `\n${Array.from(entityImports)
          .map((entity) => `import { ${entity} } from './${entity}'`)
          .join('\n')}`
      : ''

  // Add lifecycle hook imports if needed
  const selectedHooks = Object.entries(entityHooks.value)
    .filter(([_, value]) => value !== null)
    .map(([hook, implementation]) => ({ hook, implementation }))
  if (selectedHooks.length > 0) {
    imports.add('EntityOptions')
  }

  // Generate entity decorator options
  const decoratorOptions: string[] = []

  // Add entity options if provided
  if (entityOptions.value.label) {
    decoratorOptions.push(`  label: '${entityOptions.value.label}'`)
  }
  if (entityOptions.value.dbName) {
    decoratorOptions.push(`  dbName: '${entityOptions.value.dbName}'`)
  }
  if (entityOptions.value.sqlExpression) {
    decoratorOptions.push(`  // acting like a view
  // sqlExpression: () => \`SELECT id, name FROM employees
  //                       UNION ALL SELECT id, name FROM contractors\``)
  }

  // Add permissions
  const activePermissions = Object.entries(entityPermissions.value)
    .filter(([_, value]) => value !== null)
    .map(([key, value]) => {
      let permValue: any = value
      if (value === 'currentUser') {
        // For currentUser, all permissions should use function format with item parameter
        permValue = '(item) => remult.user && item.userId === remult.user?.id'
      } else if (typeof value === 'boolean') {
        permValue = String(value)
      } else if (
        typeof value === 'string' &&
        (permValue ?? '').startsWith('Allow.')
      ) {
        permValue = value
      } else if (typeof value === 'string') {
        permValue = `'${value}'`
      } else {
        permValue = String(value)
      }
      return `  ${key}: ${permValue}`
    })

  if (activePermissions.length > 0) {
    decoratorOptions.push(...activePermissions)
  }

  // Add hooks
  if (selectedHooks.length > 0) {
    const hookMethods = selectedHooks.map(({ hook, implementation }) => {
      let hookCode = ''
      if (implementation === 'todo') {
        hookCode = `  ${hook}: () => { /* TODO: implement ${hook} hook */ }`
      } else if (implementation === 'console') {
        hookCode = `  ${hook}: () => { console.log('${hook} hook called') }`
      } else if (implementation === 'custom') {
        // Add proper arguments for each hook type
        let args = ''
        switch (hook) {
          case 'validation':
            args = `item, e`
            break
          case 'saving':
          case 'saved':
          case 'deleting':
          case 'deleted':
            args = `item, e`
            break
          default:
            args = `item, e`
        }
        hookCode = `  ${hook}: async (${args}) => {\n    // Custom ${hook} implementation\n  }`
      }
      return hookCode
    })
    decoratorOptions.push(...hookMethods)
  }

  // Generate entity decorator
  let entityDecorator = `@Entity<${className.value}>('${entityKey.value}'`

  if (decoratorOptions.length > 0) {
    entityDecorator += `, {\n${decoratorOptions.join(',\n')}\n}`
  }

  entityDecorator += ')'

  // Generate the class
  let classDefinition = `${entityDecorator}\nexport class ${
    className.value
  } {\n${fieldLines.join('\n').trimEnd()}\n}`

  return `import { ${Array.from(imports).join(
    ', ',
  )} } from 'remult'${entityImportsStr}

${preClassContent}${classDefinition}`
})

// Function removed - we now handle default values in the decorator options and property assignment

const addField = async () => {
  const newId = (
    Math.max(...fields.value.map((f) => parseInt(f.id)), 0) + 1
  ).toString()
  const newField: RemultField = {
    id: newId,
    name: `field${newId}`,
    type: 'string',
    options: {},
  }

  fields.value.push(newField)

  // Auto-focus the new field and select all text
  await nextTick()
  const newFieldComponent = document.querySelector(`[data-field-id="${newId}"]`)
  if (newFieldComponent) {
    const input = newFieldComponent.querySelector('input') as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  }
}

const removeField = (fieldId: string) => {
  fields.value = fields.value.filter((f) => f.id !== fieldId)
}

// Function to detect entity name from field name (e.g., "fieldX" -> "X")
const detectEntityFromFieldName = (fieldName: string) => {
  // Check if field name follows pattern "fieldX" (not "field_X")
  if (fieldName.startsWith('field') && fieldName.length > 5) {
    const entityPart = fieldName.substring(5) // Remove "field"
    // Capitalize first letter
    return entityPart.charAt(0).toUpperCase() + entityPart.slice(1)
  }
  return null
}

const updateField = (fieldId: string, updates: Partial<RemultField>) => {
  const index = fields.value.findIndex((f) => f.id === fieldId)
  if (index !== -1) {
    fields.value[index] = { ...fields.value[index], ...updates }
  }
}

const updateEntityOption = (key: string, value: any) => {
  entityOptions.value[key] = value
}

// Handle keyboard navigation between fields
const handleFieldFocusNext = (fieldId: string) => {
  const currentIndex = fields.value.findIndex((f) => f.id === fieldId)
  if (currentIndex < fields.value.length - 1) {
    const nextFieldId = fields.value[currentIndex + 1].id
    const nextField = document.querySelector(`[data-field-id="${nextFieldId}"]`)
    if (nextField) {
      const input = nextField.querySelector('input')
      input?.focus()
    }
  }
}

const handleFieldFocusPrevious = (fieldId: string) => {
  const currentIndex = fields.value.findIndex((f) => f.id === fieldId)
  if (currentIndex > 0) {
    const prevFieldId = fields.value[currentIndex - 1].id
    const prevField = document.querySelector(`[data-field-id="${prevFieldId}"]`)
    if (prevField) {
      const input = prevField.querySelector('input')
      input?.focus()
    }
  }
}

const handleAddFieldAndFocus = async () => {
  await addField()
}

// URL sharing functionality
const updateUrlFromState = () => {
  if (typeof window === 'undefined') return

  const state = {
    className: className.value,
    entityOptions: entityOptions.value,
    fields: fields.value,
    hooks: entityHooks.value,
    permissions: entityPermissions.value,
  }

  // Use encodeURIComponent to handle Unicode characters before base64 encoding
  const encoded = btoa(encodeURIComponent(JSON.stringify(state)))
  const url = new URL(window.location.href)
  url.searchParams.set('remultor', encoded)
  window.history.replaceState(null, '', url.toString())
}

const loadStateFromUrl = () => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const encoded = url.searchParams.get('remultor')

  if (encoded) {
    try {
      // Decode the base64 and then decodeURIComponent to handle Unicode characters
      const state = JSON.parse(decodeURIComponent(atob(encoded)))
      if (state.className) className.value = state.className
      if (state.entityOptions) entityOptions.value = state.entityOptions
      if (state.fields) fields.value = state.fields
      if (state.hooks) entityHooks.value = state.hooks
      if (state.permissions) entityPermissions.value = state.permissions
    } catch (e) {
      console.warn('Failed to load state from URL:', e)
    }
  }
}

const shareUrl = async () => {
  updateUrlFromState()
  try {
    await navigator.clipboard.writeText(window.location.href)
    // Could add toast notification here
  } catch (e) {
    console.warn('Failed to copy URL to clipboard:', e)
  }
}

// Permission builder functions
const setPermission = (operation: string, value: any) => {
  entityPermissions.value[operation] = value
}

const removePermission = (operation: string) => {
  entityPermissions.value[operation] = null
}

const getPermissionDisplay = (operation: string) => {
  const value = entityPermissions.value[operation]
  if (value === null) return null

  const option = permissionOptions.find((opt) => opt.value === value)
  return option ? option.label : 'Custom'
}

const getPermissionIcon = (operation: string) => {
  const value = entityPermissions.value[operation]
  if (value === null) return null

  const option = permissionOptions.find((opt) => opt.value === value)
  return option?.icon || '⚙️'
}

const addPermission = () => {
  // Find first unused permission and add it with default value
  const unused = availablePermissions.find(
    (perm) => entityPermissions.value[perm.key] === null,
  )
  if (unused) {
    // Set different defaults based on permission type
    let defaultValue = true // Default for allowApiRead
    switch (unused.key) {
      case 'allowApiCrud':
        defaultValue = 'admin'
        break
      case 'allowApiDelete':
        defaultValue = false
        break
      case 'allowApiInsert':
        defaultValue = 'Allow.authenticated'
        break
      case 'allowApiUpdate':
        defaultValue = 'currentUser'
        break
      case 'allowApiRead':
        defaultValue = true
        break
    }
    entityPermissions.value[unused.key] = defaultValue
  }
}

const changePermissionType = (oldKey: string, newKey: string) => {
  if (oldKey !== newKey) {
    // Move the permission value to the new key
    const value = entityPermissions.value[oldKey]
    entityPermissions.value[newKey] = value
    entityPermissions.value[oldKey] = null
  }
}

// Hook management functions
const addHook = () => {
  // Find first unused hook and add it with default value
  const unused = availableHooks.find(
    (hook) => entityHooks.value[hook.key] === null,
  )
  if (unused) {
    entityHooks.value[unused.key] = 'todo' // Default to TODO implementation
  }
}

const removeHook = (hookKey: string) => {
  entityHooks.value[hookKey] = null
}

const changeHookType = (oldKey: string, newKey: string) => {
  if (oldKey !== newKey) {
    // Move the hook value to the new key
    const value = entityHooks.value[oldKey]
    entityHooks.value[newKey] = value
    entityHooks.value[oldKey] = null
  }
}

// Copy to clipboard functionality for generated code
const copyGeneratedCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    // Optionally, show a success message or visual feedback
  } catch (e) {
    // Optionally, handle error (e.g., fallback or error message)
  }
}

// Reset form to default state
const resetForm = () => {
  className.value = 'Task'
  entityOptions.value = {
    label: '',
    dbName: '',
    sqlExpression: false,
  }
  fields.value = [
    {
      id: '1',
      name: 'id',
      type: 'id',
      options: {},
    },
    {
      id: '2',
      name: 'title',
      type: 'string',
      options: {},
    },
  ]
  // Reset hooks
  Object.keys(entityHooks.value).forEach((key) => {
    entityHooks.value[key] = null
  })
  // Reset permissions
  Object.keys(entityPermissions.value).forEach((key) => {
    entityPermissions.value[key] = null
  })
  showEntityOptions.value = false
}

// Watch for changes and update URL
watch(
  [className, entityOptions, fields, entityHooks, entityPermissions],
  () => {
    if (syncStateWithUrl.value) {
      updateUrlFromState()
    }
  },
  { deep: true },
)

// Watch for sync checkbox changes - save to localStorage and sync when checked
watch(syncStateWithUrl, (newValue) => {
  // Save preference to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('remultor-sync-url', String(newValue))
  }

  // Immediately sync when checked, remove param when unchecked
  if (newValue) {
    updateUrlFromState()
  } else {
    // Remove remultor parameter from URL when sync is disabled
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('remultor')
      window.history.replaceState(null, '', url.toString())
    }
  }
})

// Load state from URL on mount
onMounted(() => {
  loadStateFromUrl()
})
</script>

<template>
  <div class="remultor">
    <div class="remultor-content">
      <div class="remultor-builder">
        <div class="remultor-settings">
          <div class="setting-group">
            <label for="className">Entity</label>
            <div class="fields-list">
              <RemovableFrame :can-remove="false">
                <!-- Entity basic info - similar to field layout -->
                <div class="entity-basic">
                  <input
                    id="className"
                    v-model="className"
                    type="text"
                    placeholder="Entity Name"
                    class="class-name-input"
                    :class="{ error: !className.trim() }"
                  />

                  <button
                    @click="showEntityOptions = !showEntityOptions"
                    class="entity-options-toggle"
                    :class="{ active: showEntityOptions }"
                    title="Show entity options"
                  >
                    ⚙️
                  </button>
                </div>

                <!-- Entity basic options using OptionsRenderer -->
                <OptionsRenderer
                  v-if="showEntityOptions"
                  :options="entityAvailableOptions"
                  :values="entityOptions"
                  id-prefix="entity"
                  @update="updateEntityOption"
                />

                <!-- Entity advanced options -->
                <div v-if="showEntityOptions" class="entity-options">
                  <!-- Permissions section -->
                  <div class="option-section">
                    <div class="section-header">
                      <h4 class="option-section-title">API Permissions</h4>
                      <Button
                        @click="addPermission"
                        variant="primary"
                        size="xs"
                        :disabled="
                          !availablePermissions.some(
                            (p) => entityPermissions[p.key] === null,
                          )
                        "
                        title="Add permission"
                      >
                        + Add
                      </Button>
                    </div>

                    <div class="permissions-list">
                      <RemovableFrame
                        v-for="(value, key) in entityPermissions"
                        v-show="value !== null"
                        :key="key"
                        remove-title="Remove permission"
                        @remove="removePermission(key)"
                      >
                        <div class="permission-item">
                          <!-- Permission type selector -->
                          <SelectDropdown
                            :model-value="key"
                            @update:model-value="
                              (value) => changePermissionType(key, value)
                            "
                            :options="
                              availablePermissions.map((perm) => ({
                                value: perm.key,
                                label: perm.label,
                                disabled:
                                  entityPermissions[perm.key] !== null &&
                                  perm.key !== key,
                              }))
                            "
                            class="permission-selector small"
                          />

                          <!-- Permission level selector -->
                          <SelectDropdown
                            v-model="entityPermissions[key]"
                            :options="
                              permissionOptions.map((opt) => ({
                                value: opt.value,
                                label: `${opt.icon} ${opt.label}`,
                              }))
                            "
                            class="permission-selector small"
                          />
                        </div>
                      </RemovableFrame>
                    </div>
                  </div>

                  <!-- Hooks section -->
                  <div class="option-section">
                    <div class="section-header">
                      <h4 class="option-section-title">Lifecycle Hooks</h4>
                      <Button
                        @click="addHook"
                        variant="primary"
                        size="xs"
                        :disabled="
                          !availableHooks.some(
                            (h) => entityHooks[h.key] === null,
                          )
                        "
                        title="Add hook"
                      >
                        + Add
                      </Button>
                    </div>

                    <div class="permissions-list">
                      <RemovableFrame
                        v-for="(value, key) in entityHooks"
                        v-show="value !== null"
                        :key="key"
                        remove-title="Remove hook"
                        @remove="removeHook(key)"
                      >
                        <div class="permission-item">
                          <!-- Hook type selector -->
                          <SelectDropdown
                            :model-value="key"
                            @update:model-value="
                              (value) => changeHookType(key, value)
                            "
                            :options="
                              availableHooks.map((hook) => ({
                                value: hook.key,
                                label: hook.label,
                                disabled:
                                  entityHooks[hook.key] !== null &&
                                  hook.key !== key,
                              }))
                            "
                            class="permission-selector small"
                          />

                          <!-- Hook implementation selector -->
                          <SelectDropdown
                            v-model="entityHooks[key]"
                            :options="
                              hookImplementations.map((impl) => ({
                                value: impl.value,
                                label: `${impl.icon} ${impl.label}`,
                              }))
                            "
                            class="permission-selector small"
                          />
                        </div>
                      </RemovableFrame>
                    </div>
                  </div>
                </div>
              </RemovableFrame>

              <FieldBuilder
                v-for="(field, index) in fields"
                :key="field.id"
                :field="field"
                :can-remove="fields.length > 1"
                :is-last-field="index === fields.length - 1"
                :data-field-id="field.id"
                @update="updateField"
                @remove="removeField"
                @focus-next="handleFieldFocusNext"
                @focus-previous="handleFieldFocusPrevious"
                @add-field-and-focus="handleAddFieldAndFocus"
              />
            </div>

            <!-- Add field button at bottom -->
            <Button
              @click="addField"
              variant="primary"
              class="add-field-bottom"
            >
              + Add Field
            </Button>

            <!-- Form controls -->
            <div class="form-controls">
              <label class="checkbox-control">
                <input
                  type="checkbox"
                  v-model="syncStateWithUrl"
                  class="control-checkbox"
                />
                <span>Sync state with URL</span>
              </label>

              <Button @click="resetForm" variant="danger">Reset</Button>
            </div>
          </div>
        </div>
      </div>

      <div class="remultor-output">
        <div class="output-header">
          <h3>Generated Code</h3>
          <div class="output-actions">
            <button
              class="copy-button"
              @click="copyGeneratedCode"
              title="Copy code"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                ></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="editor-code">
          <Code :code="generatedCode" language="typescript" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.remultor {
  margin: 2rem 0;
}

.remultor-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.remultor-builder {
  background: var(--vp-c-bg-soft);
  border-radius: 0;
  padding: 1rem;
  border: 1px solid var(--vp-c-border);
}

.remultor-output {
  position: sticky;
  top: 2rem;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.entity-basic {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  margin-bottom: 0.25rem;
}

.class-name-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  height: 36px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.class-name-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.class-name-input.error {
  border-color: var(--vp-c-danger-1);
}

.entity-options-toggle {
  padding: 0.5rem;
  background: none;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entity-options-toggle:hover,
.entity-options-toggle.active {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand-1);
}

.entity-options {
  border-top: 1px solid var(--vp-c-border);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  display: grid;
  gap: 1rem;
}

.option-section {
}

.option-section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* Padding, border, and background now handled by RemovableFrame */
}

.permission-selector {
  flex: 1;
}

.permission-status {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 100px;
}

.permission-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.permission-value {
  font-size: 0.65rem;
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.no-permissions {
  padding: 1rem;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  font-style: italic;
  border: 1px dashed var(--vp-c-border);
  border-radius: 4px;
}

.form-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-border);
  gap: 1rem;
}

.checkbox-control {
  display: flex;
  align-items: center;
  gap: 0;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 400;
  transition: all 0.2s;
  margin: 0;
  padding: 0.25rem 0;
}

.checkbox-control span {
  margin-left: 0.75rem;
  line-height: 1;
}

.checkbox-control:hover {
  color: var(--vp-c-text-1);
}

.control-checkbox {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  position: relative;
  margin: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.control-checkbox:checked {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.control-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 1px;
  left: 3px;
  color: white;
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
}

.control-checkbox:hover {
  border-color: var(--vp-c-brand-1);
}

@media (max-width: 640px) {
  .form-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .checkbox-control {
    justify-content: center;
  }
}

.add-field-bottom {
  width: 100%;
  margin-top: 1rem;
  justify-self: center;
}

.hooks-section {
  margin-top: 0.75rem;
}

.hooks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.section-label {
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  margin: 0;
}

.hooks-toggle {
  padding: 0.25rem;
  background: none;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
  height: 24px;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hooks-toggle:hover,
.hooks-toggle.active {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand-1);
}

.hooks-options {
  border-top: 1px solid var(--vp-c-border);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.hook-row {
  margin-bottom: 0.5rem;
}

.hooks-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem 0.5rem;
}

.hook-checkbox {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--vp-c-text-1);
  padding: 0.125rem 0;
}

.hook-checkbox input[type='checkbox'] {
  margin: 0;
  cursor: pointer;
  width: 14px;
  height: 14px;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
}

.output-header h3 {
  margin: 0;
  color: var(--vp-c-text-1);
}

.output-actions {
  display: flex;
  gap: 0.5rem;
}

.output-header .copy-button {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  opacity: 0.7;
  transition: all 0.2s ease;
  color: white;
  font-size: 1.1rem;
  margin-left: 0.5rem;
  position: static;
}

.output-header .copy-button:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.8);
}

/* Remove the copy button from inside the code block area */
.editor-code :deep(.copy-button) {
  display: none !important;
}

/* Copy functionality is handled by the Code component itself */

.editor-code {
  padding: 0;
  height: 100%;
  overflow: auto;
  border-radius: 0;
  position: relative;
  font-size: 0.86rem;
  background-color: var(--vp-c-bg-soft);
}

.editor-code :deep(.code-block) {
  position: relative;
}

.editor-code :deep(.copy-button) {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  opacity: 0.7;
  transition: all 0.2s ease;
  color: white;
  z-index: 20;
}

.editor-code :deep(.copy-button:hover) {
  opacity: 1;
  background: rgba(0, 0, 0, 0.8);
}

@media (max-width: 768px) {
  .remultor-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .remultor-output {
    position: static;
  }

  .remultor {
    margin: 1.5rem 0;
  }

  .remultor-builder {
    padding: 1rem;
  }
}
</style>
