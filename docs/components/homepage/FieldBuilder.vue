<script setup lang="ts">
import { ref, computed, watch } from 'vue'

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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showOptions = ref(false)

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
    value: 'cuid',
    label: 'CUID',
    description: 'Collision-resistant unique ID',
  },
  { value: 'uuid', label: 'UUID', description: 'UUID v4 identifier' },
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
]

// Available options based on field type
const availableOptions = computed(() => {
  const baseOptions = [
    {
      key: 'required',
      type: 'boolean',
      label: 'Required',
      description: 'Field is required (default: true)',
    },
    {
      key: 'allowNull',
      type: 'boolean',
      label: 'Allow Null',
      description: 'Allow null values',
    },
    {
      key: 'label',
      type: 'string',
      label: 'Label',
      description: 'Display label for the field',
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
    cuid: [
      // CUID should have no options
    ],
    uuid: [
      // UUID should have no options
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
  }

  // For createdAt and updatedAt, only allow label option from baseOptions
  if (props.field.type === 'createdAt' || props.field.type === 'updatedAt') {
    return [baseOptions.find((opt) => opt.key === 'label')!]
  }

  // For fields with no options (cuid, uuid, autoIncrement), return empty array
  if (['cuid', 'uuid', 'autoIncrement'].includes(props.field.type)) {
    return []
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

  // Auto-set field names for createdAt/updatedAt if currently fieldX
  if (type === 'createdAt' && props.field.name.startsWith('field')) {
    newName = 'createdAt'
  } else if (type === 'updatedAt' && props.field.name.startsWith('field')) {
    newName = 'updatedAt'
  }

  // Set default type for JSON and Object fields
  if (type === 'json' || type === 'object') {
    newOptions.type = '{ foo?: string }'
  }

  updateField({ type, name: newName, options: newOptions })
}

const updateOption = (key: string, value: any) => {
  const newOptions = { ...props.field.options }
  if (value === '' || value === null || value === undefined) {
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
        />

        <select
          :value="field.type"
          @change="updateFieldType(($event.target as HTMLSelectElement).value)"
          class="field-type-select"
        >
          <option
            v-for="type in fieldTypes"
            :key="type.value"
            :value="type.value"
          >
            {{ type.label }}
          </option>
        </select>

        <button
          @click="showOptions = !showOptions"
          class="options-toggle"
          :class="{ active: showOptions }"
        >
          ⚙️
        </button>

        <button
          v-if="canRemove"
          @click="removeField"
          class="remove-btn"
          title="Remove field"
        >
          🗑️
        </button>
      </div>

      <div v-if="selectedFieldType" class="field-description">
        {{ selectedFieldType.description }}
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
          :checked="field.options[option.key] || false"
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

        <div class="option-description">{{ option.description }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-builder {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 1rem;
  transition: border-color 0.2s;
}

.field-builder:hover {
  border-color: var(--vp-c-border-hover);
}

.field-header {
  margin-bottom: 0.5rem;
}

.field-basic {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.field-name-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
}

.field-name-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.field-type-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  cursor: pointer;
}

.field-type-select:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}

.options-toggle {
  padding: 0.5rem;
  background: none;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.options-toggle:hover,
.options-toggle.active {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-brand-1);
}

.remove-btn {
  padding: 0.5rem;
  background: none;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
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
  padding-top: 1rem;
  margin-top: 1rem;
  display: grid;
  gap: 0.75rem;
}

.option-group {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.5rem;
  align-items: start;
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
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.75rem;
}

.option-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
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
}
</style>
