<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";

    interface ICheckboxProps extends HTMLInputAttributes{
        id: string;
        name: string;
        checked?: boolean;
        theme?: Theme;
        children?: Snippet;
    }

    let {
        id = $bindable(''),
        name = $bindable(''),
        checked = $bindable(false),
        theme = $bindable('primary'),
        disabled = $bindable(false),
        children,
        ...rest_props
    }: ICheckboxProps = $props();
</script>

<div
    class="container"
    class:disabled={disabled}
    data-testid="{id}-checkbox-container"
>
    <label for={id} data-testid={id}>
        <input
            {...rest_props}
            {id}
            {name}
            {disabled}
            type="checkbox"
            aria-labelledby="{id}-label"
            data-testid="{id}-input"
            bind:checked={checked}
        />
        
        <div
            class="checkbox {theme} {checked ? 'checked' : ''}"
            data-testid="{id}-checkbox"
        >
            <i
                class="fa-duotone fa-regular fa-check"
                data-testid="{id}-checkbox-icon"
            ></i>
        </div>
    
        {#if children}
            <div id="{id}-label" data-testid="{id}-label">
                {@render children?.()}
            </div>
        {/if}
    </label>
</div>

<style>
    .container {
        --fa-primary-color: var(--neutral-900);
        --fa-secondary-color: var(--neutral-900);

        padding: var(--outline-offset);
        border-radius: 0.25rem;

        &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        &.disabled * {
            cursor: not-allowed;
        }

        &:has(input:focus-visible) {
            outline: 1px dashed var(--neutral-800) !important;
		    outline-offset: calc(var(--outline-offset) - 1px) !important;
        }
    }

    label {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding-right: 0.25rem;
        border-radius: 0.25rem;
        overflow: hidden;

        &:hover {
            cursor: pointer;
        }
    }

    input {
        position: absolute;
        top: -9px;
        left: -9px;
        width: 0;
        height: 0;
        opacity: 0;

        &:checked {
            & + .checkbox i {
                opacity: 1;
            }
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    .checkbox {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 0.25rem;
        
        &.primary {
            border: 1px solid var(--primary-500);
        }

        &.accent1 {
            border: 1px solid var(--accent1-500);
        }

        &.neutral {
            border: 1px solid var(--neutral-350);
        }

        &.success {
            border: 1px solid var(--success-500);
        }

        &.danger {
            border: 1px solid var(--danger-500);
        }

        & i {
            font-size: 1.25rem;
            opacity: 0;
        }
    }
</style>