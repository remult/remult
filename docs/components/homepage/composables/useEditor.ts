import { ref, watch } from 'vue'
import { type CodeStep } from '../stepsData'
import { useUserPreference } from '../../composables/useUserPreference'

export function useEditor(stepsData: CodeStep[]) {
	const steps = ref<CodeStep[]>([])
	const currentStep = ref<CodeStep | null>(null)
	const currentFile = ref<string | null>(null)
	const codeRef = ref<any>(null)

	const { framework, keyContext } = useUserPreference()

	// Helper function to find appropriate file based on framework and keyContext
	const findAppropriateFile = (
		files: CodeStep['files'],
		isMovingForward: boolean = true,
	) => {
		const availableFiles = files.filter(
			(f) => f.framework === framework.value || !f.framework,
		)

		// First try to find a file matching the keyContext
		const matchingFile = availableFiles.find(
			(f) => f.keyContext === keyContext.value,
		)

		// If moving forward, prioritize files with changes
		if (isMovingForward) {
			// If we found a matching file and it has changes, return it
			if (matchingFile && matchingFile.changed) {
				return matchingFile
			}

			// Otherwise, find the first file with changes
			const fileWithChanges = availableFiles.find((f) => f.changed)
			if (fileWithChanges) {
				return fileWithChanges
			}
		}

		// If not moving forward, or no files with changes were found,
		// return matching file or the first available file
		return matchingFile || availableFiles[0]
	}

	// Add function to save current step index
	const saveCurrentStepIndex = (step: CodeStep) => {
		const index = steps.value.findIndex((s) => s.id === step.id)
		localStorage.setItem('currentStepIndex', index.toString())
	}

	// Initialize editor
	const initializeEditor = () => {
		steps.value = stepsData

		// Try to get saved step index from localStorage
		const savedStepIndex = localStorage.getItem('currentStepIndex')
		const initialStep = savedStepIndex
			? stepsData[parseInt(savedStepIndex)] || stepsData[0]
			: stepsData[0]

		currentStep.value = initialStep

		// For initial load, assume moving forward
		const appropriateFile = findAppropriateFile(initialStep.files, true)
		currentFile.value = appropriateFile?.name || null
		if (appropriateFile) {
			keyContext.value = appropriateFile.keyContext
		}
	}

	// Watch for framework changes
	watch(framework, () => {
		if (!currentStep.value) return

		// When framework changes, maintain current direction (use default true)
		const appropriateFile = findAppropriateFile(currentStep.value.files)
		if (appropriateFile) {
			currentFile.value = appropriateFile.name
			keyContext.value = appropriateFile.keyContext
		}
	})

	// Modify selectStep to save the selection and track direction
	const selectStep = (step: CodeStep) => {
		// Determine if we're moving forward based on the step index
		const currentIndex = steps.value.findIndex(
			(s) => s.id === currentStep.value?.id,
		)
		const newIndex = steps.value.findIndex((s) => s.id === step.id)
		const isMovingForward = newIndex > currentIndex

		currentStep.value = step
		saveCurrentStepIndex(step)

		const appropriateFile = findAppropriateFile(step.files, isMovingForward)
		if (appropriateFile) {
			currentFile.value = appropriateFile.name
			keyContext.value = appropriateFile.keyContext
		}
	}

	const selectFile = (fileName: string) => {
		currentFile.value = fileName
		if (currentStep.value) {
			const file = currentStep.value.files.find((f) => f.name === fileName)
			if (file?.keyContext) {
				keyContext.value = file.keyContext
			}
		}
	}

	const getCurrentCode = () => {
		if (!currentStep.value || !currentFile.value) return ''
		// Get the one that matches the framework first...
		let file = currentStep.value.files.find(
			(f) => f.name === currentFile.value && f.framework === framework.value,
		)
		// If not found, get the first one that matches the name
		if (!file) {
			file = currentStep.value.files.find((f) => f.name === currentFile.value)
		}
		return file?.content || ''
	}

	const getCurrentLanguage = () => {
		if (!currentStep.value || !currentFile.value) return 'typescript'
		const file = currentStep.value.files.find((f) => f.name === currentFile.value)
		return file?.languageCodeHighlight || 'typescript'
	}

	// Watch for code changes to scroll to changed lines
	watch(
		() => getCurrentCode(),
		(newCode, oldCode) => {
			if (newCode !== oldCode) {
				setTimeout(() => {
					codeRef.value?.scrollToChangedLines()
				}, 100)
			}
		},
	)

	return {
		steps,
		currentStep,
		currentFile,
		codeRef,
		framework,
		keyContext,
		initializeEditor,
		selectStep,
		selectFile,
		getCurrentCode,
		getCurrentLanguage,
	}
} 