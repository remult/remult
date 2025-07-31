<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import SelectDropdown from './SelectDropdown.vue'

interface RemultField {
  id: string
  name: string
  type: string
  options: Record<string, any>
}

interface Props {
  field: RemultField
  canRemove: boolean
}

interface Emits {
  (e: 'update', fieldId: string, updates: Partial<RemultField>): void
  (e: 'remove', fieldId: string): void
  (e: 'focusNext', fieldId: string): void
  (e: 'focusPrevious', fieldId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showOptions = ref(false)
const fieldNameInput = ref<HTMLInputElement>()

// Available field types from Fields.ts
const fieldTypes = [
  { value: 'string', label: 'String', description: 'Text field' },
  {
    value: 'number',
    label: 'Number',
    description: 'Numeric field with validation',
  },
  { value: 'integer', label: 'Integer', description: 'Integer numbers only' },
  { value: 'boolean', label: 'Boolean', description: 'True/false field' },
  { value: 'date', label: 'Date', description: 'Date and time' },
  { value: 'dateOnly', label: 'Date Only', description: 'Date without time' },
  {
    value: 'id',
    label: 'ID',
    description: 'Auto-generated unique identifier',
  },
  {
    value: 'autoIncrement',
    label: 'Auto Increment',
    description: 'Auto-incrementing number',
  },
  {
    value: 'createdAt',
    label: 'Created At',
    description: 'Timestamp when created',
  },
  {
    value: 'updatedAt',
    label: 'Updated At',
    description: 'Timestamp when updated',
  },
  { value: 'literal', label: 'Literal', description: 'String literals union' },
  { value: 'json', label: 'JSON', description: 'JSON object field' },
  { value: 'object', label: 'Object', description: 'Serialized object' },
  {
    value: 'list',
    label: 'Value List',
    description: 'ValueListFieldType class',
  },
  {
    value: 'toOne',
    label: 'Relations toOne',
    description: 'One-to-one or many-to-one relationship',
  },
  {
    value: 'toMany',
    label: 'Relations toMany',
    description: 'One-to-many or many-to-many relationship',
  },
]

// Available options based on field type
const availableOptions = computed(() => {
  const baseOptions = [
    {
      key: 'required',
      type: 'boolean',
      label: 'Required',
      // description: 'Field is required',
    },
    {
      key: 'allowNull',
      type: 'boolean',
      label: 'Allow Null',
      // description: 'Allow null values',
    },
    {
      key: 'label',
      type: 'string',
      label: 'Label',
      description: 'Display label for the field',
    },
    {
      key: 'dbName',
      type: 'string',
      label: 'DB Name',
      description: 'Database column name',
    },
  ]

  const typeSpecificOptions: Record<string, any[]> = {
    string: [
      {
        key: 'defaultValue',
        type: 'string',
        label: 'Default Value',
        description: 'Default string value',
      },
      {
        key: 'maxLength',
        type: 'number',
        label: 'Max Length',
        description: 'Maximum character length',
      },
      {
        key: 'minLength',
        type: 'number',
        label: 'Min Length',
        description: 'Minimum character length',
      },
    ],
    number: [
      {
        key: 'defaultValue',
        type: 'number',
        label: 'Default Value',
        description: 'Default numeric value',
      },
    ],
    integer: [
      {
        key: 'defaultValue',
        type: 'number',
        label: 'Default Value',
        description: 'Default integer value',
      },
    ],
    boolean: [
      // Boolean default value is always false, not customizable
    ],
    date: [
      // Date default value is always new Date(), not customizable
    ],
    dateOnly: [
      // DateOnly default value is always new Date(), not customizable
    ],
    id: [
      // ID should have no options
    ],
    autoIncrement: [
      // Auto Increment should have no options
    ],
    createdAt: [
      // Only label is customizable for createdAt
    ],
    updatedAt: [
      // Only label is customizable for updatedAt
    ],
    literal: [
      {
        key: 'literalValues',
        type: 'string',
        label: 'Literal Values',
        description:
          'Comma-separated literal values (e.g. open,closed,pending)',
      },
      // Removed constName option - do like value list
    ],
    json: [
      {
        key: 'defaultValue',
        type: 'string',
        label: 'Default Value',
        description: 'Default JSON object (e.g. { foo?: string })',
      },
      {
        key: 'type',
        type: 'string',
        label: 'Type',
        description: 'TypeScript type definition (e.g. { foo?: string })',
      },
    ],
    object: [
      {
        key: 'defaultValue',
        type: 'string',
        label: 'Default Value',
        description: 'Default object value (e.g. { foo?: string })',
      },
      {
        key: 'type',
        type: 'string',
        label: 'Type',
        description: 'TypeScript type definition (e.g. { foo?: string })',
      },
    ],
    list: [
      {
        key: 'items',
        type: 'string',
        label: 'Items',
        description:
          'Format: id:label,id:label (e.g. low:🔽 Low Priority,high:🔥 High Priority)',
      },
    ],
    toOne: [
      {
        key: 'entity',
        type: 'string',
        label: 'Entity',
        description: 'Related entity class name (e.g. User, Category)',
      },
      {
        key: 'foreignKey',
        type: 'string',
        label: 'Foreign Key',
        description: 'Foreign key field name (e.g. userId, categoryId)',
      },
      {
        key: 'label',
        type: 'string',
        label: 'Label',
        description: 'Display label for the relation (e.g. The Customer)',
      },
      {
        key: 'defaultIncluded',
        type: 'boolean',
        label: 'Default Included',
        description: 'Include this relation by default in queries',
      },
    ],
    toMany: [
      {
        key: 'entity',
        type: 'string',
        label: 'Entity',
        description: 'Related entity class name (e.g. User, Category)',
      },
      {
        key: 'foreignKey',
        type: 'string',
        label: 'Foreign Key',
        description: 'Foreign key field name in related entity (e.g. taskId)',
      },
      {
        key: 'label',
        type: 'string',
        label: 'Label',
        description: 'Display label for the relation (e.g. The Comments)',
      },
      {
        key: 'defaultIncluded',
        type: 'boolean',
        label: 'Default Included',
        description: 'Include this relation by default in queries',
      },
    ],
  }

  // For createdAt and updatedAt, only allow label option from baseOptions
  if (props.field.type === 'createdAt' || props.field.type === 'updatedAt') {
    return [baseOptions.find((opt) => opt.key === 'label')!]
  }

  // For ID fields, allow label and allowNull options (no required option)
  if (props.field.type === 'id') {
    return baseOptions.filter((opt) => opt.key !== 'required')
  }

  // For fields with no options (autoIncrement), return empty array
  if (['autoIncrement'].includes(props.field.type)) {
    return []
  }

  // For relation fields, only return type-specific options (no base options)
  if (['toOne', 'toMany'].includes(props.field.type)) {
    return typeSpecificOptions[props.field.type] || []
  }

  // For date and dateOnly, only return base options (no default value)
  if (['date', 'dateOnly'].includes(props.field.type)) {
    return baseOptions
  }

  // For boolean, only return base options (no default value)
  if (props.field.type === 'boolean') {
    return baseOptions
  }

  return [...baseOptions, ...(typeSpecificOptions[props.field.type] || [])]
})

const updateField = (updates: Partial<RemultField>) => {
  emit('update', props.field.id, updates)
}

const updateFieldName = (name: string) => {
  updateField({ name })
}

const updateFieldType = (type: string) => {
  // Clear options when changing type to avoid conflicts
  const newOptions: Record<string, any> = {}
  let newName = props.field.name

  // Pre-populate list fields with example items using lowercase IDs
  if (type === 'list') {
    newOptions.items = 'low:🔽 Low Priority,high:🔥 High Priority'
  }

  // Pre-populate relation fields with example values
  if (type === 'toOne') {
    newOptions.entity = 'Category'
    newOptions.foreignKey = 'categoryId'
  }

  if (type === 'toMany') {
    newOptions.entity = 'Comment'
    // Don't set foreignKey by default - let user specify if needed
  }

  // Always set field name to 'createdAt' or 'updatedAt' when type is those values
  if (type === 'createdAt') {
    newName = 'createdAt'
  } else if (type === 'updatedAt') {
    newName = 'updatedAt'
  } else if (type === 'list') {
    newName = 'priority'
  } else if (type === 'toOne') {
    newName = 'category'
  } else if (type === 'toMany') {
    newName = 'comments'
  }

  // Set default type for JSON and Object fields
  if (type === 'json' || type === 'object') {
    newOptions.type = '{ foo?: string }'
  }

  updateField({ type, name: newName, options: newOptions })
}

const updateOption = (key: string, value: any) => {
  const newOptions = { ...props.field.options }
  // Remove the key if value is false (for booleans), or '', null, or undefined
  if (
    value === '' ||
    value === null ||
    value === undefined ||
    (typeof value === 'boolean' && value === false)
  ) {
    delete newOptions[key]
  } else {
    newOptions[key] = value
  }
  updateField({ options: newOptions })
}

const removeField = () => {
  emit('remove', props.field.id)
}

const selectedFieldType = computed(() =>
  fieldTypes.find((ft) => ft.value === props.field.type),
)

// Add computed property to check if there are options
const hasOptions = computed(() => availableOptions.value.length > 0)

// Handle keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === 'ArrowDown') {
    event.preventDefault()
    emit('focusNext', props.field.id)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    emit('focusPrevious', props.field.id)
  }
}

// Auto-focus new input
const focusInput = async () => {
  await nextTick()
  if (fieldNameInput.value) {
    fieldNameInput.value.focus()
  }
}

// Expose focus method
defineExpose({ focusInput })
</script>

<template>
  <div class="field-builder">
    <div class="field-header">
      <div class="field-basic">
        <input
          :value="field.name"
          @input="updateFieldName(($event.target as HTMLInputElement).value)"
          placeholder="Field name"
          class="field-name-input"
          ref="fieldNameInput"
          @keydown="handleKeyDown"
        />

        <SelectDropdown
          :model-value="field.type"
          @update:model-value="updateFieldType"
          :options="fieldTypes.map(t => ({ value: t.value, label: t.label }))"
          class="field-type-select"
        />

        <button
          @click="showOptions = !showOptions"
          class="options-toggle"
          :class="{ active: showOptions }"
          :disabled="!hasOptions"
          :title="!hasOptions ? 'No options available' : 'Show field options'"
        >
          ⚙️
        </button>
      </div>
    </div>

    <div v-if="showOptions" class="field-options">
      <div
        v-for="option in availableOptions"
        :key="option.key"
        class="option-group"
      >
        <label :for="`${field.id}-${option.key}`" class="option-label">
          {{ option.label }}
        </label>

        <!-- Boolean options -->
        <input
          v-if="option.type === 'boolean'"
          :id="`${field.id}-${option.key}`"
          type="checkbox"
          :checked="field.options[option.key] === true"
          @change="
            updateOption(
              option.key,
              ($event.target as HTMLInputElement).checked,
            )
          "
          class="option-checkbox"
        />

        <!-- Number options -->
        <input
          v-else-if="option.type === 'number'"
          :id="`${field.id}-${option.key}`"
          type="number"
          :value="field.options[option.key] || ''"
          @input="
            updateOption(
              option.key,
              parseInt(($event.target as HTMLInputElement).value) || undefined,
            )
          "
          class="option-input"
          :placeholder="option.description"
        />

        <!-- String options -->
        <input
          v-else
          :id="`${field.id}-${option.key}`"
          type="text"
          :value="field.options[option.key] || ''"
          @input="
            updateOption(
              option.key,
              ($event.target as HTMLInputElement).value || undefined,
            )
          "
          class="option-input"
          :placeholder="option.description"
        />

        <!-- Remove or comment out the description below input -->
        <!-- <div class="option-description">{{ option.description }}</div> -->
      </div>
    </div>
    
    <!-- Cross button for removal positioned at top right of entire field frame -->
    <button
      v-if="canRemove"
      @click="removeField"
      class="remove-cross"
      title="Remove field"
      tabindex="-1"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.field-builder {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  padding: 0.75rem;
  transition: border-color 0.2s;
  position: relative;
}

.field-builder:hover {
  border-color: var(--vp-c-border-hover);
}

.field-header {
  margin-bottom: 0.25rem;
}

.field-basic {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  margin-bottom: 0.25rem;
}

.field-name-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  max-width: 100px;
  height: 36px;
  box-sizing: border-box;
}

.field-name-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.field-type-select {
  max-width: 160px;
}

.options-toggle {
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

.options-toggle:hover,
.options-toggle.active {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand-1);
}

.options-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--vp-c-bg);
  border-color: var(--vp-c-border);
}

.remove-btn {
  padding: 0.5rem;
  background: none;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  cursor: pointer;
  color: var(--vp-c-danger-1);
  transition: all 0.2s;
}

.remove-btn:hover {
  background: var(--vp-c-danger-soft);
  border-color: var(--vp-c-danger-1);
}

.field-description {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  font-style: italic;
}

.field-options {
  border-top: 1px solid var(--vp-c-border);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  display: grid;
  gap: 0.5rem;
}

.option-group {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.5rem;
  align-items: center;
}

.option-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.option-input {
  padding: 0.375rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.75rem;
}

.option-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.option-input::placeholder {
  opacity: 0.5;
  color: var(--vp-c-text-3);
}

.option-checkbox {
  justify-self: start;
  margin-top: 0.125rem;
}

.option-description {
  grid-column: 1 / -1;
  font-size: 0.625rem;
  color: var(--vp-c-text-3);
  margin-top: -0.25rem;
}


.remove-cross {
  position: absolute;
  top: -9px;
  right: -9px;
  width: 18px;
  height: 18px;
  background: var(--vp-c-danger-1);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0.7;
  z-index: 10;
}

.remove-cross:hover {
  opacity: 1;
  background: var(--vp-c-danger-2);
  transform: scale(1.1);
}

.remove-cross:focus {
  outline: none;
}

@media (max-width: 640px) {
  .field-basic {
    flex-direction: column;
    align-items: stretch;
  }

  .option-group {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }

  .option-description {
    grid-column: 1;
    margin-top: 0.25rem;
  }

  .field-builder {
    padding: 0.4rem;
  }
}
</style>
