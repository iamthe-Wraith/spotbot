<script lang="ts">
    import { WORKFLOW_STATUS, type IWorkflow } from "$lib/state/db.svelte";
    import Icon from "$lib/components/Icon.svelte";

    interface IWorkflowStepsProps {
        workflow: IWorkflow;
    }

    interface IStep {
        name: string;
        url: string;
        completed: boolean;
    }

    let { workflow }: IWorkflowStepsProps = $props();

    let steps = $derived.by(() => {
        const _steps: IStep[] = [
            {
                name: 'Workflow Created',
                url: `/workflows?workflow_id=${workflow.id}`,
                completed: true,
            },
            {
                name: 'Files Uploaded',
                url: `/workflows/${workflow.id}`,
                completed: workflow?.status === WORKFLOW_STATUS.FILES_UPLOADED ||
                    workflow?.status === WORKFLOW_STATUS.COLUMNS_MAPPED ||
                    workflow?.status === WORKFLOW_STATUS.PROCESSING ||
                    workflow?.status === WORKFLOW_STATUS.PROCESSED ||
                    workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
            {
                name: 'Columns Mapped',
                url: `/workflows/${workflow.id}/map-columns`,
                completed: workflow?.status === WORKFLOW_STATUS.COLUMNS_MAPPED ||
                    workflow?.status === WORKFLOW_STATUS.PROCESSING ||
                    workflow?.status === WORKFLOW_STATUS.PROCESSED ||
                    workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
            {
                name: 'Data Processed',
                url: `/workflows/${workflow.id}/map-columns`,
                completed: workflow?.status === WORKFLOW_STATUS.PROCESSED ||
                    workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
            {
                name: 'Workflow Completed',
                url: `/workflows/${workflow.id}`,
                completed: workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
        ];

        return _steps;
    });
</script>

<div class="workflow-steps">
    {#each steps as step, i}
        <a href={step.url} class="step" class:completed={step.completed}>
            {#if step.completed}
                <Icon icon="fa-solid fa-check" theme="success" />
            {/if}
            <span class="step-text">
                {step.name}
            </span>
        </a>
        {#if i < steps.length - 1}
            <div class="step-divider">
                <i class="fa-duotone fa-solid fa-chevron-right"></i>
            </div>
        {/if}
    {/each}
</div>

<style>
    .workflow-steps {
        margin-bottom: 2rem;
    }

    .step {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
        text-decoration: none;

        &:hover .step-text {
            text-decoration: underline;
        }
    }

    .step-text {
        color: var(--primary-300);
    }

    .step.completed {
        --fa-primary-color: var(--success-900);
        --fa-secondary-color: var(--primary-500);

        .step-text {
            color: var(--primary-900);
        }
    }

    .workflow-steps {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 1rem;
    }
</style>