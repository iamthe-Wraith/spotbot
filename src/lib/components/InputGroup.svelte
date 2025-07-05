<script lang="ts" module>
    import type { Snippet } from "svelte";

    export interface IInputGroupProps {
        id: string;
        error?: string;
        label?: string;
        children: Snippet;
        hide_text_on_error?: boolean;
        text?: string;
        text_position?: 'top' | 'bottom';
        required?: boolean;
        disabled?: boolean;
    }
</script>

<script lang="ts">
    let {
        id,
        label,
        children,
        error,
        hide_text_on_error = false,
        text,
        text_position = 'top',
        required = false,
        disabled = false,
        ...rest
    }: IInputGroupProps = $props();
</script>

<div
    class="input-group"
    class:disabled={disabled}
    data-testid={`${id}-input-group`}
>
    {#if (id && label) || (text && text_position === 'top')}
        <div class="input-group-header">
            {#if id && label}
                <label for={id} data-testid={`${id}-input-group-label`}>
                    <span>{label}</span>
                    {#if !required}
                        <span class="optional">(Optional)</span>
                    {/if}
                </label>
            {/if}

            {#if text && text_position === 'top'}
                <p class="input-group-text" data-testid={`${id}-input-group-text`}>{text}</p>
            {/if}
        </div>
    {/if}

    {@render children()}

    {#if text && text_position === 'bottom' && (!error || !hide_text_on_error)}
        <p class="input-group-text" data-testid={`${id}-input-group-text`}>{text}</p>
    {/if}

    {#if error}
        <p class="error" data-testid={`${id}-input-group-error`}>{error}</p>
    {/if}
</div>

<style>
    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
    }

    .input-group-header {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    label {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
        font-size: 1rem;

        &:hover {
            cursor: pointer;
        }

        .optional {
            font-size: 0.7rem;
            color: var(--secondary-500);
        }
    }

    p {
        &.input-group-text {
            margin: 0;
            font-size: 0.8rem;
            color: var(--neutral-900);
            line-height: 1.5;
        }
    }
</style>