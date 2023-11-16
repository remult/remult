// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }
}

declare module 'remult' {
  export interface FieldOptions<entityType, valueType> {
    placeholder?: string
  }

  // example of adding a new field to the UserInfo remult interface
  export interface UserInfo {
    avatar_url?: string
  }
}

// You must leave this here!
export {}
