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
    <div class="footer-content">
        <p>TydalWave</p>
        <p>Copyright {new Date().getFullYear()}</p>
    </div>

    <nav class="footer-links">
        <a
            href="https://github.com/iamthe-Wraith/tydalwave"
            target="_blank"
            class="footer-link"
        >
            <i class="fa-brands fa-square-github"></i>
            GitHub
        </a>
    </nav>
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: var(--footer-height);
        padding: 0.5rem 1rem;
        border-top: 1px solid var(--primary-200);

        p {
            margin: 0;
        }

        .footer-links {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .footer-link {  
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            color: var(--neutral-900);

            &:hover {
                color: var(--primary-700);
                cursor: pointer;
            }
        }

        .footer-link i {
            font-size: 1.3rem;
        }
    }
</style>