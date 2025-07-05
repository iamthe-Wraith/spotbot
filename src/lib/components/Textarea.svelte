<script lang="ts">
    import type { HTMLTextareaAttributes } from "svelte/elements";
	import InputGroup from "./InputGroup.svelte";

    interface ITextareaProps extends HTMLTextareaAttributes {
        id: string;
        theme?: Theme;
        value: string;
        label?: string;
        maxlength?: number;
        text?: string;
        error?: string;
        required?: boolean;
    }

    let {
        id = $bindable(''),
        theme = 'primary',
        name = $bindable(''),
        value = $bindable(''),
        label = $bindable(''),
        text = $bindable(''),
        error = $bindable(''),
        required = $bindable(false),
        maxlength,
        ...rest_props
    }: ITextareaProps = $props();
</script>

<InputGroup
    {id}
    {label}
    {error}
    {text}
    {required}
>
    <div class="textarea-container {theme}">
        <textarea
            {id}
            {required}
            {name}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-errormessage={error ? `${id}-error` : undefined}
            bind:value
            {...rest_props}
            class:error={error}
        ></textarea>
    </div>

    <div
        class="max-length-indicator"
        class:error={value && maxlength && value.length > maxlength}
    >
        {#if maxlength}
            {value?.length ?? 0} / {maxlength}
        {/if}
    </div>
</InputGroup>

<style>
    .textarea-container {
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

        &:has(textarea:focus-visible) {
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

    textarea {
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

	.max-length-indicator {
		font-size: 0.8em;
		text-align: right;

		&:not(.error) {
			color: var(--neutral-500);
		}
	}
</style>