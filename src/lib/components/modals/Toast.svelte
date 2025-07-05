<script lang="ts">
	import { toast } from '$lib/state/toast.svelte';
    import { flip } from 'svelte/animate';
	import type { HTMLDialogAttributes } from 'svelte/elements';
    import { fade } from 'svelte/transition';

    const props: HTMLDialogAttributes = $props();

    let open: boolean;

    let dialog: HTMLDialogElement;

    $effect(() => {
        if (toast.messages.length)  {
            openToastDialog();
        } else {
            closeToastDialog();
        }
    })

    function closeToastDialog() {
        dialog?.close();
        open = false;
    }

    function closeToastMessage(toastId: string) {
        return function() {
            toast.remove(toastId);
        }
    }

    function openToastDialog() {
        if (open) return;

        dialog?.show();
        open = true;
    }
</script>

<dialog
    data-testid="toast-messages-dialog"
    bind:this={dialog}
    {...props}
>
    <ul class="toast-messages">
        {#each toast.messages as toast_message (toast_message.id)}
            <li
                class="toast-message {toast_message.type}"
                data-testid="toast-message"
                out:fade
                animate:flip
            >
                <div class="toast-message-content">
                    {#if toast_message.icon}
                        <div class="icon-wrapper">
                            <i class="toast-message-icon {toast_message.icon}"></i>
                        </div>
                    {/if}

                    <p class="toast-message-text" data-testid="toast-message-text">{ toast_message.message }</p>

                    {#if toast_message.redirect}
                        <a
                            href={toast_message.redirect.url} 
                            target="{toast_message.redirect.target || '_self'}"
                            class="toast-message-link"
                            onclick={closeToastMessage(toast_message.id)}
                        >
                            { toast_message.redirect.text }
                        </a>
                    {/if}
                </div>

                <button
                    class="close" 
                    onclick={closeToastMessage(toast_message.id)}
                    data-testid="close-toast-message-button"
                    type="button"
                    aria-label="Close toast message"
                >
                    <i class="fa-duotone fa-solid fa-hexagon-xmark"></i>
                </button>
            </li>
        {/each}
    </ul>
</dialog>

<style>
    dialog {
        position: fixed;
        top: 3.75rem;
        right: unset;
        left: 50%;
        width: 80vw;
        max-width: 30rem;
        border: none;
        border-radius: 0.5rem;
        background: transparent;
        transform: translate(-50%, 0);
        outline: none;
        z-index: 1005;

        @media (min-width: 768px) {
            top: 1rem;
            width: 90vw;
        }
    }

    .toast-message {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.5rem 0.5rem 1rem;
        border-radius: 0.25rem;

        &:not(:last-child) {
            margin-bottom: 0.5rem;
        }

        &.success {
            --fa-primary-color: var(--success-500);
            --fa-secondary-color: var(--success-300);

            background: var(--success-100);
            border: 1px solid var(--success-500);

            & .icon-wrapper i {
                --fa-primary-color: var(--success-600);
                --fa-secondary-color: var(--success-500);
            }
        }

        &.danger {
            --fa-primary-color: var(--danger-800);
            --fa-secondary-color: var(--danger-400);

            background: var(--danger-100);
            border: 1px solid var(--danger-500);

            .icon-wrapper i {
                --fa-primary-color: var(--danger-600);
                --fa-secondary-color: var(--danger-600);
            }
        }

        &.primary {
            --fa-primary-color: var(--primary-500);
            --fa-secondary-color: var(--primary-300);

            background: var(--primary-100);
            border: 1px solid var(--primary-500);

            .icon-wrapper i {
                --fa-primary-color: var(--primary-600);
                --fa-secondary-color: var(--primary-500);
            }
        }

        &.accent1 {
            --fa-primary-color: var(--accent1-700);
            --fa-secondary-color: var(--accent1-400);

            background: var(--accent1-100);
            border: 1px solid var(--accent1-500);

            .icon-wrapper i {
                --fa-primary-color: var(--accent1-700);
                --fa-secondary-color: var(--accent1-600);
            }
        }

        &.accent2 {
            --fa-primary-color: var(--accent2-700);
            --fa-secondary-color: var(--accent2-400);

            background: var(--accent2-100);
            border: 1px solid var(--accent2-500);

            .icon-wrapper i {
                --fa-primary-color: var(--accent2-700);
                --fa-secondary-color: var(--accent2-600);
            }
        }

        &.accent3 {
            --fa-primary-color: var(--accent3-700);
            --fa-secondary-color: var(--accent3-400);

            background: var(--accent3-100);
            border: 1px solid var(--accent3-500);

            .icon-wrapper i {
                --fa-primary-color: var(--accent3-700);
                --fa-secondary-color: var(--accent3-600);
            }
        }

        &.neutral {
            --fa-primary-color: var(--neutral-700);
            --fa-secondary-color: var(--neutral-400);

            background: var(--neutral-100);
            border: 1px solid var(--neutral-500);

            .icon-wrapper i {
                --fa-primary-color: var(--neutral-700);
                --fa-secondary-color: var(--neutral-600);
            }
        }

        .toast-message-content {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            gap: 1rem;
        }

        .icon-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;

            i {
                font-size: 1.75rem;
                --fa-primary-color: var(--neutral-600);
                --fa-secondary-color: var(--neutral-400);
            }
        }

        @media (max-width: 768px) {
            top: 2rem;
            right: 1rem;
            left: 1rem;
        }
    }

    .toast-message-text {
        margin: 0;
    }

    .toast-message-link {
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
    }

    .close {
        display: flex;
        justify-content: center;
        align-items: center;
        background: transparent;
        border: none;
        border-radius: 0.25rem;
        z-index: 10;

        &:hover {
            cursor: pointer;
        }

        i {
            font-size: 1.4rem;
        }
    }
</style>