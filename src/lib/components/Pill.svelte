<script lang="ts">
    let { children, theme = 'primary' } = $props();
</script>

<div class="pill {theme}">
    {@render children()}
</div>

<style>
    .pill {
        padding: 0.25rem 0.75rem;
        border-radius: 10rem;
        background-color: var(--pill-background);
        color: var(--pill-text);
        text-transform: capitalize;
    }

    .pill.primary {
        --pill-background: var(--primary-400);
        --pill-text: var(--neutral-900);
    }

    .pill.accent1 {
        --pill-background: var(--accent1-400);
        --pill-text: var(--neutral-100);
    }

    .pill.neutral {
        --pill-background: var(--neutral-100);
        --pill-text: var(--neutral-900);
    }

    .pill.light {
        --pill-background: var(--neutral-800);
        --pill-text: var(--neutral-100);
    }

    .pill.success {
        --pill-background: var(--success-400);
        --pill-text: var(--success-900);
    }

    .pill.danger {
        --pill-background: var(--danger-300);
        --pill-text: var(--danger-900);
    }
</style>