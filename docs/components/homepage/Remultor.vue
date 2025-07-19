<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FieldBuilder from './FieldBuilder.vue'
import Code from './Code.vue'

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
      const constName = field.options.constName || `${field.name}Options`
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
        field.options.items || 'low:🔽 Low,medium:⚡ Medium,high:🔥 High'

      // Generate ValueListFieldType class
      preClassLines.push(`@ValueListFieldType()`)
      preClassLines.push(`export class ${className} {`)

      // Generate static instances
      items.split(',').forEach((item: string) => {
        const [id, label] = item.split(':').map((s: string) => s.trim())
        if (id && label) {
          preClassLines.push(
            `  static ${id} = new ${className}('${id}', '${label}')`,
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
        tsType = 'any'
        break
    }

    // Determine if field is required (default is required unless explicitly set to false)
    const isRequired = field.options.required !== false
    const hasDefaultValue =
      field.options.defaultValue !== undefined &&
      field.options.defaultValue !== ''

    // Determine property syntax
    let propertyDeclaration = ''
    if (hasDefaultValue) {
      // When there's a default value, use it and let TypeScript infer the type
      let defaultVal = field.options.defaultValue
      if (typeof defaultVal === 'string') {
        defaultVal = `'${defaultVal}'`
      }
      propertyDeclaration = `  ${field.name} = ${defaultVal}`
    } else if (field.type === 'literal' && field.options.literalValues) {
      // For literal types, use the first value as default
      const firstValue = field.options.literalValues.split(',')[0]?.trim()
      propertyDeclaration = `  ${field.name}: ${tsType} = '${firstValue}'`
    } else if (field.type === 'list' && field.options.items) {
      // For list types, use the first item as default
      const firstItem = field.options.items.split(',')[0]?.split(':')[0]?.trim()
      const className = field.name.charAt(0).toUpperCase() + field.name.slice(1)
      propertyDeclaration = `  ${field.name}: ${tsType} = ${className}.${firstItem}`
    } else {
      // Special fields that don't need explicit types or defaults
      const skipTypeAndDefault = [
        'createdAt',
        'updatedAt',
        'cuid',
        'uuid',
        'autoIncrement',
      ].includes(field.type)
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
  fields.value.push({
    id: newId,
    name: `field${newId}`,
    type: 'string',
    options: {},
  })
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

// Copy functionality is handled by the Code component itself
</script>

<template>
  <div class="remultor l-home">
    <div class="remultor-intro l-home__title fade-in">
      <h2>🧙‍♂️ Remultor</h2>
      <p>
        Interactive Remult entity class builder. Configure your entity and see
        the generated code in real-time!
      </p>
    </div>

    <div class="remultor-content l-home__content fade-in">
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
  margin: 4rem 0;
}

.remultor-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.remultor-builder {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 1.5rem;
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
  border-radius: 6px;
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
  border-radius: 6px;
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
}

.output-header h3 {
  margin: 0;
  color: var(--vp-c-text-1);
}

/* Copy functionality is handled by the Code component itself */

.editor-code {
  padding: 0;
  height: 100%;
  overflow: scroll;
  border-radius: 12px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .remultor-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .remultor-output {
    position: static;
  }
}
</style>
