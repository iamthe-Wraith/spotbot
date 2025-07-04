<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
    import '../styles.css';

    let { children } = $props();
</script>

<header>
    <Logo />
</header>

<main>
    {@render children()}
</main>

<footer>
    <p>Tydal</p>
    <p>Copyright {new Date().getFullYear()}</p>
</footer>

<style>
    :global(body) {
        --fa-primary-color: var(--primary-500);
        --fa-secondary-color: var(--primary-800);

        --header-height: 4rem;
        --footer-height: 4rem;
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: var(--header-height);
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--primary-200);
    }

    main {
        min-height: calc(100vh - var(--header-height) - var(--footer-height));
        padding: 1rem;
    }

    footer {
        height: var(--footer-height);
        padding: 0.5rem 1rem;
        border-top: 1px solid var(--primary-200);

        p {
            margin: 0;
        }
    }
</style>