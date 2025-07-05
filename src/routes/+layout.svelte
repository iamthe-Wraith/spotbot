<script lang="ts">
	import Link from '$lib/components/Link.svelte';
import Logo from '$lib/components/Logo.svelte';
	import Toast from '$lib/components/modals/Toast.svelte';
    import '../styles.css';

    let { children } = $props();
</script>

<header>
    <Logo />

    <nav>
        <Link href="/workflows" theme="light-text">
            Workflows
        </Link>
    </nav>
</header>

<main>
    {@render children()}
</main>

<footer>
    <p>Tydal</p>
    <p>Copyright {new Date().getFullYear()}</p>
</footer>

<Toast />

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
        display: flex;
        flex-direction: column;
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