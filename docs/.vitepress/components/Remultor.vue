<script setup lang="ts">
import { ref, computed } from 'vue'
import FieldBuilder from './FieldBuilder.vue'
import Code from '../../components/homepage/Code.vue'

interface RemultField {
  id: string
  name: string
  type: string
  options: Record<string, any>
}

const className = ref('Task')
const fields = ref<RemultField[]>([
  {
    id: '1',
    name: 'id',
    type: 'cuid',
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
  const fieldLines: string[] = []
  const preClassLines: string[] = []

  // Analyze fields to determine needed imports
  fields.value.forEach((field) => {
    if (['cuid', 'uuid', 'createdAt', 'updatedAt'].includes(field.type)) {
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
    }
  })

  imports.add('Entity')

  // Generate field decorators and properties
  fields.value.forEach((field) => {
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
    }

    // Always add parentheses if no options
    if (!optionsStr) {
      optionsStr = '()'
    }

    // Use Field decorator for list type, Fields for others
    const decorator = field.type === 'list' ? 'Field' : `Fields.${field.type}`
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
      case 'json':
      case 'object':
        // Use custom type if provided, otherwise default to any
        tsType = field.options.type || 'any'
        break
    }

    // Determine if field is required (default is required unless explicitly set to false)
    const isRequired = field.options.required !== false
    const hasDefaultValue =
      field.options.defaultValue !== undefined &&
      field.options.defaultValue !== ''

    // Determine property syntax
    let propertyDeclaration = ''

    // Handle fields with automatic default values first
    if (field.type === 'boolean') {
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
    } else {
      // Special fields that don't need explicit types or defaults
      const skipTypeAndDefault = ['cuid', 'uuid', 'autoIncrement'].includes(
        field.type,
      )
      if (skipTypeAndDefault) {
        propertyDeclaration = `  ${field.name}${
          isRequired ? '!' : '?'
        }: ${tsType}`
      } else {
        // Regular fields with explicit types
        propertyDeclaration = `  ${field.name}${
          isRequired ? '!' : '?'
        }: ${tsType}`
      }
    }

    fieldLines.push(propertyDeclaration)
    fieldLines.push('')
  })

  const preClassContent =
    preClassLines.length > 0 ? preClassLines.join('\n') + '\n' : ''

  return `import { ${Array.from(imports).join(', ')} } from 'remult'

${preClassContent}@Entity('${entityKey.value}')
export class ${className.value} {
${fieldLines.join('\n').trimEnd()}
}`
})

// Function removed - we now handle default values in the decorator options and property assignment

const addField = () => {
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
}

const removeField = (fieldId: string) => {
  fields.value = fields.value.filter((f) => f.id !== fieldId)
}

const updateField = (fieldId: string, updates: Partial<RemultField>) => {
  const index = fields.value.findIndex((f) => f.id === fieldId)
  if (index !== -1) {
    fields.value[index] = { ...fields.value[index], ...updates }
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
          </div>

          <div class="setting-group">
            <div class="fields-header">
              <h3>Fields</h3>
              <button @click="addField" class="add-field-btn">
                + Add Field
              </button>
            </div>

            <div class="fields-list">
              <FieldBuilder
                v-for="field in fields"
                :key="field.id"
                :field="field"
                :can-remove="fields.length > 1"
                @update="updateField"
                @remove="removeField"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="remultor-output">
        <div class="output-header">
          <h3>Generated Code</h3>
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
