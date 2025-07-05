<script lang="ts" generics="T">
    import { onMount, type Snippet } from 'svelte'
    import { CLOSE_MODAL_EVENT, MODAL_CHANGE_EVENT, OPEN_MODAL_EVENT } from '$lib/constants/custom-events';
    import { browser } from '$app/environment';
	import { navigating } from '$app/state';
	import type { HTMLDialogAttributes } from 'svelte/elements';
	import { dispatch } from '$lib/utils/dispatch';

    interface IModalProps extends HTMLDialogAttributes {
        open?: boolean;
        title?: string;
        theme?: Theme;
        modal_contents?: Snippet<[data: T | null]>;
    }

    let { id, title, theme, modal_contents, ...rest_props }: IModalProps = $props();

    let modal: HTMLDialogElement;

    let data: T | null = $state(null);

    $effect(() => {
        if(navigating) close_modal(new CustomEvent(CLOSE_MODAL_EVENT, { detail: { id } }));
    })

    onMount(() => {
        if (!modal) return;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                close_modal(new CustomEvent(CLOSE_MODAL_EVENT, { detail: { id } }));
            }
        });

        modal.addEventListener('close', on_close);
        modal.addEventListener('cancel', on_close);
        modal.addEventListener('show', on_show);

        document.addEventListener(OPEN_MODAL_EVENT, open_modal);
        document.addEventListener(CLOSE_MODAL_EVENT, close_modal);

        return () => {
            modal.removeEventListener('close', on_close);
            modal.removeEventListener('cancel', on_close);
            modal.removeEventListener('show', on_show);

            document.removeEventListener(OPEN_MODAL_EVENT, open_modal);
            document.removeEventListener(CLOSE_MODAL_EVENT, close_modal);
        }
    });

    function close_modal(e: Event) {
        if (e instanceof CustomEvent && e.detail.id === id) {
            if (browser) document.body.style.overflow = 'auto';
            modal?.close();
            data = null;
        }
    }

    function on_close() {
        dispatch(MODAL_CHANGE_EVENT, { id, open: false });
    }

    function on_show() {
        dispatch(MODAL_CHANGE_EVENT, { id, open: true });
    }

    function open_modal(e: Event) {
        if (e instanceof CustomEvent && e.detail.id === id) {
            if (browser) document.body.style.overflow = 'hidden';
            data = e.detail.data;
            modal?.showModal();
        }
    }
</script>

<dialog
    {id}
    class={theme}
    data-testid={id}
    bind:this={modal}
    {...rest_props}
>
    <div class="modal-contents">
        <button
            class="close" 
            onclick={() => close_modal(new CustomEvent(CLOSE_MODAL_EVENT, { detail: { id } }))}
            data-testid="close-modal-button"
            aria-label="Close modal"
        >
            <i class="fa-regular fa-times"></i>
        </button>

        {#if title}
            <div class="modal-header" data-testid="modal-header">
                <div class="h2">{title}</div>
            </div>
        {/if}

        <section data-testid="modal-contents">
            {@render modal_contents?.(data)}
        </section>
    </div>
</dialog>

<style>
    dialog {
        --modal-position-top: 50%;
        --modal-position-left: 50%;
        --modal-max-width: 40rem;
        --modal-max-height: 90dvh;
        --modal-border-color: var(--primary-400);
        --modal-transform: translate(-50%, -50%);

        position: fixed;
        top: var(--modal-position-top);
        left: var(--modal-position-left);
        width: 90vw;
        max-width: var(--modal-max-width, 40rem);
        max-height: var(--modal-max-height, 90dvh);
        background-color: var(--neutral-100);
        border: 1px solid var(--modal-border-color);
        border-radius: 0.5rem;
        transform: var(--modal-transform);
        z-index: 1002;
        overflow: auto;

        &.accent1 {
            --modal-border-color: var(--accent1-400);
        }

        &.accent2 {
            --modal-border-color: var(--accent2-400);
        }
        
        &.accent3 {
            --modal-border-color: var(--accent3-400);
        }

        &.danger {
            --modal-border-color: var(--danger-400);
        }

        &.success {
            --modal-border-color: var(--success-400);
        }
    }
    dialog::backdrop {
        backdrop-filter: blur(4px);
        background: rgba(0, 0, 0, 0.3);
    }

    dialog[open]::backdrop {
        animation: fade-and-blur 0.3s ease-out;
    }

    @keyframes fade-and-blur {
        from {
            opacity: 0;
            backdrop-filter: blur(0px);
        }
        to {
            opacity: 1;
            backdrop-filter: blur(4px);
        }
    }

    dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes zoom {
		from {
			transform: var(--modal-transform) scale(0.95);
		}
		to {
			transform: var(--modal-transform) scale(1);
		}
	}

	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
    
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

    .modal-contents {
        position: relative;
    }

    .close {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 1.3rem;
        height: 1.3rem;
        background-color: var(--neutral-250);
        border: none;
        border-radius: 0.25rem;
        color: var(--neutral-700);
        z-index: 10;
        
        & i {
            font-size: 1.2rem;
        }

        &:hover {
            background-color: var(--neutral-350);
            cursor: pointer;
        }
    }

    .modal-header {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        padding: 0.5rem 2.5rem 0 1rem;

        & .h2 {
            margin-right: 1rem;
            color: var(--neutral-900);
        }
    }

    section {
        padding: 1rem 1rem 0.75rem 1rem;
    }
</style>