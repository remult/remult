import colors from 'picocolors'
const { cyan } = colors
type ColorFunc = (str: string | number) => string
export type Framework = {
  name: string
  display: string
  color: ColorFunc
  remultServer?: {
    remultServerFunction: string
    import: string
    path?: string
  }
  variants?: FrameworkVariant[]
  envFile?: string
}
type FrameworkVariant = {
  name: string
  display: string
  color: ColorFunc
}

export const FRAMEWORKS: Framework[] = [
  {
    name: 'react',
    display: 'React',
    color: cyan,
  },
  {
    name: 'angular',
    display: 'Angular',
    color: cyan,
  },
  {
    name: 'vue',
    display: 'Vue',
    color: cyan,
  },
  {
    name: 'nextjs',
    display: 'Next.js',
    color: cyan,
    envFile: '.env.local',
    remultServer: {
      remultServerFunction: 'remultNextApp',
      import: 'remult-next',
      path: 'src/api.ts',
    },
  },
  {
    name: 'sveltekit',
    display: 'SvelteKit',
    color: cyan,
    remultServer: {
      remultServerFunction: 'remultSveltekit',
      import: 'remult-sveltekit',
      path: 'src/api.ts',
    },
  },
]
