<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";

    type LinkTheme = Theme |
        'primary-text' |
        'accent1-text' |
        'light-text' |
        'neutral-text' |
        'danger-text' |
        'success-text' |
        'transparent';
    
    interface ILinkProps extends HTMLAnchorAttributes {
        theme?: LinkTheme;
        size?: 'small' | 'medium' | 'large';
        processing?: boolean;
        nowrap?: boolean;
    }

    let {
        theme = 'primary',
        size = 'medium',
        processing = false,
        nowrap = false,
        children,
        ...rest_props
    }: ILinkProps = $props();
</script>

<a
    class={`${theme} ${size}`}
    class:processing={processing}
    class:nowrap={nowrap}
    {...rest_props}
>
    {#if processing}
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    {/if}

    <span>
        {@render children?.()}
    </span>
</a>

<style>
    a {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
        font-weight: 400;
        border-radius: 0.25rem;
        text-decoration: none;

        &:not(:disabled):not(.processing):hover {
            cursor: pointer;
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        & > span {
            opacity: 1;
        }

        &.nowrap {
            white-space: nowrap;
        }

        &.small {
            padding: 0.15rem 0.35rem;
            font-size: 0.7rem;
        }

        &.medium {
            padding: 0.25rem 0.55rem;
            font-size: 0.875rem;
        }

        &.large {
            padding: 0.5rem 1rem;
            font-size: 1.15rem;
        }

        &.primary {
            min-height: 2rem;
            background-color: var(--primary-100);
            border: 1px solid var(--primary-500);
            color: var(--neutral-900);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                background-color: var(--primary-200);
                border: 1px solid var(--primary-600);
            }
            
            & * {
                color: var(--primary-500);
            }

            & > span {
                color: var(--neutral-900);
            }
        }

        &.primary-text {
            padding: 0;
            background-color: transparent;
            border: none;
            color: var(--primary-500);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                color: var(--primary-300);

                & > span {
                    color: var(--primary-300);
                }
            }

            & * {
                color: var(--primary-500);
            }

            & > span {
                color: var(--primary-500);
            }
        }

        &.accent1 {
            min-height: 2rem;
            background-color: var(--accent1-100);
            border: 1px solid var(--accent1-500);
            color: var(--neutral-900);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                background-color: var(--accent1-200);
                border: 1px solid var(--accent1-600);
            }

            & * {
                color: var(--accent1-500);
            }

            & > span {
                color: var(--neutral-900);
            }
        }

        &.accent1-text {
            padding: 0;
            background-color: transparent;
            border: none;
            color: var(--accent1-500);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                color: var(--accent1-300);

                & > span {
                    color: var(--accent1-300);
                }
            }

            & * {
                color: var(--accent1-500);
            }

            & > span {
                color: var(--accent1-500);
            }
        }

        &.light {
            min-height: 2rem;
            background-color: var(--neutral-250);
            border: 1px solid var(--neutral-450);
            color: var(--neutral-900);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                background-color: var(--neutral-350);
                border: 1px solid var(--neutral-550);
            }

            & * {
                color: var(--neutral-500);
            }

            & > span {
                color: var(--neutral-900);
            }
        }

        &.light-text {
            padding: 0;
            background-color: transparent;
            border: none;
            color: var(--neutral-900);
            
            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                color: var(--neutral-700);

                & > span {
                    color: var(--neutral-700);
                }
            }
            
            & * {
                color: var(--neutral-500);
            }

            & > span {
                color: var(--neutral-900);
            }
        }

        &.neutral {
            min-height: 2rem;
            background-color: var(--neutral-100);
            border: 1px solid var(--neutral-250);
            color: var(--neutral-750);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                background-color: var(--neutral-150);
                border: 1px solid var(--neutral-250);
            }

            & * {
                color: var(--neutral-750);
            }

            & > span {
                color: var(--neutral-750);
            }
        }

        &.neutral-text {
            padding: 0;
            background-color: transparent;
            border: none;
            color: var(--neutral-750);
            
            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                color: var(--neutral-350);

                & > span {
                    color: var(--neutral-350);
                }
            }
            
            & * {
                color: var(--neutral-750);
            }

            & > span {
                color: var(--neutral-750);
            }
        }

        &.danger {
            min-height: 2rem;
            background-color: var(--danger-100);
            border: 1px solid var(--danger-500);
            color: var(--neutral-900);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                background-color: var(--danger-200);
                border: 1px solid var(--danger-600);
            }

            & * {
                color: var(--danger-500);
            }

            & > span {
                color: var(--neutral-900);
            }
        }

        &.danger-text {
            padding: 0;
            background-color: transparent;
            border: none;
            color: var(--danger-500);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                color: var(--danger-300);

                & > span {
                    color: var(--danger-300);
                }
            }

            & * {
                color: var(--danger-500);
            }

            & > span {
                color: var(--danger-500);
            }
        }

        &.success {
            min-height: 2rem;
            background-color: var(--success-100);
            border: 1px solid var(--success-500);
            color: var(--neutral-900);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                background-color: var(--success-200);
                border: 1px solid var(--success-600);
            }

            & * {
                color: var(--success-500);
            }

            & > span {
                color: var(--neutral-900);
            }
        }

        &.success-text {
            padding: 0;
            background-color: transparent;
            border: none;
            color: var(--success-500);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                color: var(--success-300);

                & > span {
                    color: var(--success-300);
                }
            }

            & * {
                color: var(--success-500);
            }

            & > span {
                color: var(--success-500);
            }
            }

        &.transparent {
            background-color: transparent;
            border: none;
            color: var(--neutral-900);

            &:hover:not(:disabled),
            &:focus:not(:disabled) {
                color: var(--neutral-700);
            }

            & * {
                color: var(--neutral-900);
            }

            & > span {
                color: var(--neutral-900);
            }
        }
    }

    .spinner-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .spinner {
        width: 1rem;;
        height: 1rem;
        border: 2px solid var(--neutral-900);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
    }
</style>