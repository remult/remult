<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import FieldBuilder from './FieldBuilder.vue'
import Code from '../../components/homepage/Code.vue'

interface RemultField {
  id: string
  name: string
  type: string
  options: Record<string, any>
}

const className = ref('Task')
const entityHooks = ref({
  saving: false,
  saved: false,
  deleting: false,
  deleted: false
})
const useEntityFunction = ref(false)
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
        return value !== undefined && value !== ''
      },
    )

    if (filteredOptions.length > 0) {
      const formattedOptions = filteredOptions
        .map(([key, value]) => {
          if (typeof value === 'string') return `${key}: '${value}'`
          return `${key}: ${value}`
        })
        .join(', ')

      if (formattedOptions) {
        optionsStr = `({ ${formattedOptions} })`
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
        fieldLines.push('')
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
    fieldLines.push('')
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
  const selectedHooks = Object.entries(entityHooks.value).filter(([_, enabled]) => enabled).map(([hook]) => hook)
  if (selectedHooks.length > 0) {
    imports.add('EntityOptions')
  }

  // Add entity function import if enabled
  if (useEntityFunction.value) {
    entityImportsStr += `\nimport { entity } from 'remult'`
  }

  // Generate entity decorator options
  let entityOptions = `'${entityKey.value}'`
  const optionsParts = []
  
  if (selectedHooks.length > 0) {
    const hookMethods = selectedHooks.map(hook => `    ${hook}: () => { /* TODO: implement ${hook} hook */ }`).join(',\n')
    optionsParts.push(`{\n  key: '${entityKey.value}',\n${hookMethods}\n  }`)
  }
  
  if (optionsParts.length > 0) {
    entityOptions = optionsParts.join(', ')
  }

  // Generate the class
  let classDefinition = `@Entity(${entityOptions})\nexport class ${className.value} {\n${fieldLines.join('\n').trimEnd()}\n}`
  
  // Add entity function if enabled
  if (useEntityFunction.value) {
    classDefinition += `\n\nexport const ${className.value.toLowerCase()}Repository = entity(${className.value})`
  }

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
  
  // Auto-focus the new field
  await nextTick()
  const newFieldComponent = document.querySelector(`[data-field-id="${newId}"]`)
  if (newFieldComponent) {
    const input = newFieldComponent.querySelector('input')
    input?.focus()
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

// Handle keyboard navigation between fields
const handleFieldFocusNext = (fieldId: string) => {
  const currentIndex = fields.value.findIndex(f => f.id === fieldId)
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
  const currentIndex = fields.value.findIndex(f => f.id === fieldId)
  if (currentIndex > 0) {
    const prevFieldId = fields.value[currentIndex - 1].id
    const prevField = document.querySelector(`[data-field-id="${prevFieldId}"]`)
    if (prevField) {
      const input = prevField.querySelector('input')
      input?.focus()
    }
  }
}

// URL sharing functionality
const updateUrlFromState = () => {
  if (typeof window === 'undefined') return
  
  const state = {
    className: className.value,
    fields: fields.value,
    hooks: entityHooks.value,
    useEntity: useEntityFunction.value
  }
  
  const encoded = btoa(JSON.stringify(state))
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
      const state = JSON.parse(atob(encoded))
      if (state.className) className.value = state.className
      if (state.fields) fields.value = state.fields
      if (state.hooks) entityHooks.value = state.hooks
      if (state.useEntity !== undefined) useEntityFunction.value = state.useEntity
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

// Copy to clipboard functionality for generated code
const copyGeneratedCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    // Optionally, show a success message or visual feedback
  } catch (e) {
    // Optionally, handle error (e.g., fallback or error message)
  }
}

// Watch for changes and update URL
watch([className, fields, entityHooks, useEntityFunction], () => {
  updateUrlFromState()
}, { deep: true })

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
            <label for="className">Class Name</label>
            <input
              id="className"
              v-model="className"
              type="text"
              placeholder="MyEntity"
              class="class-name-input"
            />
            
            <!-- Hooks checkboxes -->
            <div class="hooks-section">
              <label class="section-label">Lifecycle Hooks</label>
              <div class="hooks-grid">
                <label class="hook-checkbox">
                  <input type="checkbox" v-model="entityHooks.saving" />
                  <span>saving</span>
                </label>
                <label class="hook-checkbox">
                  <input type="checkbox" v-model="entityHooks.saved" />
                  <span>saved</span>
                </label>
                <label class="hook-checkbox">
                  <input type="checkbox" v-model="entityHooks.deleting" />
                  <span>deleting</span>
                </label>
                <label class="hook-checkbox">
                  <input type="checkbox" v-model="entityHooks.deleted" />
                  <span>deleted</span>
                </label>
              </div>
            </div>
            
            <!-- Entity function checkbox -->
            <div class="entity-function-section">
              <label class="hook-checkbox">
                <input type="checkbox" v-model="useEntityFunction" />
                <span>Add entity&lt;{{ className }}&gt;() repository</span>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <div class="fields-header">
              <h3>Fields</h3>
            </div>

            <div class="fields-list">
              <FieldBuilder
                v-for="field in fields"
                :key="field.id"
                :field="field"
                :can-remove="fields.length > 1"
                :data-field-id="field.id"
                @update="updateField"
                @remove="removeField"
                @focus-next="handleFieldFocusNext"
                @focus-previous="handleFieldFocusPrevious"
              />
            </div>
            
            <!-- Add field button at bottom -->
            <button @click="addField" class="add-field-btn add-field-bottom">
              + Add Field
            </button>
          </div>
        </div>
      </div>

      <div class="remultor-output">
        <div class="output-header">
          <h3>Generated Code</h3>
          <div class="output-actions">
            <button
              class="copy-button"
              @click="shareUrl"
              title="Copy shareable URL"
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
                <path d="m6 9 6 6 6-6"/>
                <path d="M10 4v9"/>
                <circle cx="4" cy="9" r="2"/>
                <circle cx="20" cy="9" r="2"/>
                <path d="M14 5a4 4 0 0 0-4 4"/>
              </svg>
            </button>
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

.class-name-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.class-name-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.fields-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.fields-header h3 {
  margin: 0;
  color: var(--vp-c-text-1);
}

.add-field-btn {
  padding: 0.5rem 1rem;
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 0;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.add-field-btn:hover {
  background: var(--vp-c-brand-2);
}

.add-field-bottom {
  width: 100%;
  margin-top: 1rem;
  justify-self: center;
}

.hooks-section {
  margin-top: 1rem;
}

.section-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
}

.hooks-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.hook-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--vp-c-text-1);
}

.hook-checkbox input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

.entity-function-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-border);
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
