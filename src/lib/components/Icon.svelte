<script lang="ts">
    interface IIconProps {  
        icon: string;
        theme?: Theme;
    }

    let { icon, theme = 'primary' }: IIconProps = $props();
</script>

<span class="icon {theme}">
    <i class="{icon}"></i>
</span>

<style>
    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 100%;
        background-color: var(--icon-background, --primary-400);
    }

    .icon.primary {
        --fa-primary-color: var(--primary-900);
        --fa-secondary-color: var(--primary-700);

        --icon-background: var(--primary-400);
    }

    .icon.accent1 {
        --fa-primary-color: var(--neutral-100);
        --fa-secondary-color: var(--neutral-300);

        --icon-background: var(--accent1-400);
    }

    .icon.neutral {
        --fa-primary-color: var(--neutral-900);
        --fa-secondary-color: var(--neutral-700);

        --icon-background: var(--neutral-100);
    }

    .icon.light {
        --fa-primary-color: var(--neutral-100);
        --fa-secondary-color: var(--neutral-300);

        --icon-background: var(--neutral-800);
    }

    .icon.success {
        --fa-primary-color: var(--success-900);
        --fa-secondary-color: var(--success-700);

        --icon-background: var(--success-400);
    }

    .icon.danger {
        --fa-primary-color: var(--danger-900);
        --fa-secondary-color: var(--danger-700);

        --icon-background: var(--danger-300);
    }
</style>