// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	export type Order = 'asc' | 'desc';

	// ------------------------------------------------------------------------------------------------
	// ---------------------------------------- STYLES TYPES ------------------------------------------
	// ------------------------------------------------------------------------------------------------
	export type Theme = 'primary' | 'accent1' | 'light' | 'neutral' | 'danger' | 'success';
}

export {};
