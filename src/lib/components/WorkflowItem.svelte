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
        </div>

        <div class="workflow-info">
            <div class="confidence-threshold">
                {workflow.confidence_threshold}%
                <span>
                    Confidence
                </span>
            </div>

            <Pill theme={get_workflow_theme(workflow.status)}>
                {workflow.status.split('_').join(' ')}
            </Pill>
        </div>
    </a>
</article>

<style>
    article a {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        width: 100%;
        padding: 1rem;
        border: 1px solid var(--primary-500);
        border-radius: 0.5rem;
        text-decoration: none;

        &:hover,
        &:focus-visible {
            border-color: var(--accent1-500);
        }

        &:hover {
            outline: 1px solid var(--accent1-500);
        }

        & > * {
            flex: 1;
            min-width: 0;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .name {
        margin: 0;
        color: var(--neutral-900);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
    }

    .workflow-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;

    }

    .confidence-threshold {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
        font-size: 1.5rem;
        color: var(--neutral-900);

        span {
            font-size: 0.65rem;
            color: var(--primary-500);
        }
    }
</style>