<script lang="ts">
    interface IWithTooltip {
        id: string;
        text: string;
        delay?: number;
        position?: 'top' | 'bottom' | 'left' | 'right';
        align?: 'start' | 'center' | 'end';
        no_wrap?: boolean;
        children: () => any;
    }

    const {
        id,
        text,
        // the number of seconds to delay the tooltip from appearing
        delay = 0,
        position = 'top',
        align = 'center',
        no_wrap = false,
        children
    }: IWithTooltip = $props();
</script>

<div
    {id}
    class="with-tooltip no-default-color"
    data-testid={id}
    style="--transition-delay:{delay}s"
>
    <span>
        {@render children()}
    </span>
    <span
        style="--transition-delay:{delay}s"
        class="tooltip {position} {align}"
        class:no-wrap={no_wrap}
    >
        {text}
    </span>
</div>

<style>
    .with-tooltip {
        --transition-delay: 0s;

        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        
        & span:first-child {
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--neutral-450);
        }

        &:hover .tooltip {
            transition: opacity 0.15s ease-in-out;
            transition-delay: var(--transition-delay, 0s);
            opacity: 1;
            pointer-events: none;
        }
    }

    .tooltip {
        position: absolute;
        display: block;
        width: 50vw;
        max-width: 20rem;
        padding: 0.25rem 0.5rem;
        background: var(--neutral-50);
        border: 1px solid var(--neutral-250);
        border-radius: 0.25rem;
        font-size: 0.75rem;
        transition: opacity 0.15s ease-in-out;
        opacity: 0;
        pointer-events: none;

        &.no-wrap {
            white-space: nowrap;
        }

        &.top {
            bottom: calc(100% + 0.3rem);

            &.start {
                left: 0;
            }

            &.center {
                left: 50%;
                transform: translateX(-50%);
            }

            &.end {
                right: 0;
            }
        }

        &.bottom {
            top: calc(100% + 0.3rem);

            &.start {
                left: 0;
            }

            &.center {
                left: 50%;
                transform: translateX(-50%);
            }

            &.end {
                right: 0;
            }
        }

        &.left {
            right: calc(100% + 0.3rem);

            &.start {
                top: 0;
            }

            &.center {
                top: 50%;
                transform: translateY(-50%);
            }

            &.end {
                bottom: 0;
            }
        }

        &.right {
            left: calc(100% + 0.3rem);

            &.start {
                top: 0;
            }

            &.center {
                top: 50%;
                transform: translateY(-50%);
            }

            &.end {
                bottom: 0;
            }
        }
    }
</style>