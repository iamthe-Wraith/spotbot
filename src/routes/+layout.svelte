<script lang="ts">
    import '../styles.css';

    let { children } = $props();
</script>

<header>
    <h1>SpotBot</h1>
</header>

<main>
    {@render children()}
</main>

<footer>
    <p>SpotBot</p>
    <p>Copyright {new Date().getFullYear()}</p>
</footer>

<style>
    :global(body) {
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

        h1 {
            margin: 0;
        }
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