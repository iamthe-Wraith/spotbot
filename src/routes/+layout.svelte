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
    <nav class="footer-links">
        <a
            href="https://github.com/iamthe-Wraith/tydalwave/issues/new?template=bug_report.md"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
        >
            <i class="fa-duotone fa-regular fa-bug"></i>
            Report a bug
        </a>

        <a
            href="https://github.com/iamthe-Wraith/tydalwave/issues/new?template=feature_request.md"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
        >
            <i class="fa-duotone fa-regular fa-lightbulb"></i>
            Request a feature
        </a>

        <a
            href="https://github.com/iamthe-Wraith/tydalwave"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
        >
            <i class="fa-brands fa-square-github"></i>
            GitHub
        </a>
    </nav>

    <div class="footer-content">
        <p>TydalWave - Copyright {new Date().getFullYear()}</p>
    </div>
</footer>

<Toast />

<style>
    :global(body) {
        --fa-primary-color: var(--primary-500);
        --fa-secondary-color: var(--primary-800);

        --header-height: 4rem;
        --footer-height: 10rem;

        @media (min-width: 768px) {
            --header-height: 4rem;
            --footer-height: 5rem;
        }
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
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        height: var(--footer-height);
        padding: 1rem;
        border-top: 1px solid var(--primary-200);

        .footer-content p {
            margin: 0;
            font-size: 0.8rem;
            color: var(--primary-500);
            text-align: center;
        }

        .footer-links {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.7rem;

            @media (min-width: 768px) {
                flex-direction: row;
                justify-content: center;
                gap: 1rem;
            }
        }

        .footer-link {  
            --fa-primary-color: var(--primary-500);
            --fa-secondary-color: var(--primary-500);

            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: var(--primary-500);
            text-decoration: none;

            &:hover {
                --fa-primary-color: var(--primary-400);
                --fa-secondary-color: var(--primary-400);

                color: var(--primary-400);
                cursor: pointer;
            }
        }

        .footer-link i {
            font-size: 1.1rem;
        }
    }
</style>