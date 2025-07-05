<script lang="ts">
	import { WORKFLOW_STATUS } from "$lib/state/db.svelte";
	import Pill from "./Pill.svelte";

    let { workflow } = $props();

    const get_workflow_theme = (status: string): Theme => {
        switch (status) {
            case WORKFLOW_STATUS.CREATED:
                return 'accent1';
            case WORKFLOW_STATUS.FILES_UPLOADED:
            case WORKFLOW_STATUS.COLUMNS_MAPPED:
            case WORKFLOW_STATUS.PROCESSING:
            case WORKFLOW_STATUS.PROCESSED:
                return 'primary';
            case WORKFLOW_STATUS.COMPLETED:
                return 'success';
            case WORKFLOW_STATUS.FAILED:
                return 'danger';
            default:
                return 'neutral';
        }
    }; 
</script>

<article>
    <a href={`/workflows/${workflow.id}`}>
        <div>
            <p class="name h2">
                {workflow.name}
            </p>

            <p class="description">
                {workflow.description}
            </p>
        </div>

        <div>
            <Pill theme={get_workflow_theme(workflow.status)}>
                {workflow.status}
            </Pill>
        </div>
    </a>
</article>

<style>
    article a {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border: 1px solid var(--primary-300);
        border-radius: 0.5rem;
        text-decoration: none;

        &:hover,
        &:focus-visible {
            border-color: var(--accent1-500);
        }
    }

    .name {
        margin-bottom: 0.5rem;
        color: var(--neutral-900);
    }

    .description {
        margin: 0;
    }
</style>