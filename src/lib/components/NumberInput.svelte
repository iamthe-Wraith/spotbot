<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";
	import InputGroup, { type IInputGroupProps } from "./InputGroup.svelte";

    type NumberInputProps = Omit<IInputGroupProps, 'children'> & HTMLInputAttributes & {
        error?: string;
        id: string;
        input?: HTMLInputElement | null;
        label?: string;
        required?: boolean;
        text?: string;
        theme?: Theme; // The theme of the input
        value: number | null;
    }

    let {
        error = $bindable(''),
        id,
        input = $bindable(null),
        label,
        required = false,
        text,
        text_position,
        theme = 'primary',
        value = $bindable(null),
        ...rest
    }: NumberInputProps = $props();
</script>

<InputGroup
    {id}
    {label}
    {error}
    {text}
    {text_position}
    {required}
>
    <div class="input-container {theme}">
        <input
            {id}
            type="number"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-errormessage={error ? `${id}-error` : undefined}
            bind:this={input}
            bind:value={value}
            {...rest}
        />
    </div>
</InputGroup>

<style>
    .input-container {
        --theme-inactive: var(--neutral-900);
        --theme-active: var(--primary-500);
        --theme-color: var(--neutral-900);

        position: relative;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        border: 1px solid var(--theme-inactive);
        border-radius: 0.25rem;
        background: transparent;
        overflow: hidden;

        &:has(input:focus-visible) {
            border-color: var(--theme-active);

            & .hex {
                opacity: 0.3;
            }
        }
    }

    .primary {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--primary-500);
        --theme-color: var(--neutral-900);
    }

    .accent1 {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--accent1-500);
        --theme-color: var(--neutral-900);
    }

    .neutral {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--neutral-700);
        --theme-color: var(--neutral-900);
    }

    .danger {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--danger-500);
        --theme-color: var(--neutral-900);
    }

    .success {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--success-500);
        --theme-color: var(--neutral-900);
    }

    input {
        position: relative;
        grid-area: 1;
		width: 100%;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		color: var(--theme-color);
        background-color: transparent;
        border: none;
        border-radius: 0.25rem;
        z-index: 2;

        &::placeholder {
            color: var(--neutral-350);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
	}
</style>