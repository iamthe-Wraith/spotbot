<script lang="ts">
    import { WORKFLOW_STATUS, type IWorkflow } from "$lib/state/db.svelte";
    import Icon from "$lib/components/Icon.svelte";
	import { page } from "$app/state";

    interface IWorkflowStepsProps {
        workflow: IWorkflow;
    }

    interface IStep {
        name: string;
        url: string;
        selected: boolean;
        completed: boolean;
    }

    let { workflow }: IWorkflowStepsProps = $props();

    let steps = $derived.by((): IStep[] => {
        return [
            {
                name: 'Workflow Created',
                url: `/workflows?workflow_id=${workflow.id}`,
                selected: page.url.pathname === `/workflows`,
                completed: true,
            },
            {
                name: 'Files Uploaded',
                url: `/workflows/${workflow.id}`,
                selected: page.url.pathname === `/workflows/${workflow.id}`,
                completed: workflow?.status === WORKFLOW_STATUS.FILES_UPLOADED ||
                    workflow?.status === WORKFLOW_STATUS.COLUMNS_MAPPED ||
                    workflow?.status === WORKFLOW_STATUS.MATCHES_REVIEWED ||
                    workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
            {
                name: 'Columns Mapped',
                url: `/workflows/${workflow.id}/map-columns`,
                selected: page.url.pathname === `/workflows/${workflow.id}/map-columns`,
                completed: workflow?.status === WORKFLOW_STATUS.COLUMNS_MAPPED ||
                    workflow?.status === WORKFLOW_STATUS.MATCHES_REVIEWED ||
                    workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
            {
                name: 'Matches Reviewed',
                url: `/workflows/${workflow.id}/review-matches`,
                selected: page.url.pathname === `/workflows/${workflow.id}/review-matches`,
                completed: workflow?.status === WORKFLOW_STATUS.MATCHES_REVIEWED ||
                    workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
            {
                name: 'Completed',
                url: `/workflows/${workflow.id}/results`,
                selected: page.url.pathname === `/workflows/${workflow.id}/results`,
                completed: workflow?.status === WORKFLOW_STATUS.COMPLETED,
            },
        ];
    });
</script>

<div class="workflow-steps">
    <div class="workflow-steps-container">
        {#each steps as step, i}
            <a
                href={step.url}
                class="step"
                class:completed={step.completed}
                class:selected={step.selected}
            >
                <div
                    class="step-icon flex-center"
                    class:hidden={!step.completed}
                >
                    {#if step.completed}
                        <Icon icon="fa-solid fa-check" theme="success" />
                    {/if}
                </div>
                <span class="step-text">
                    {step.name}
                </span>

                {#if i < steps.length - 1}
                    <div class="step-divider">
                        <i class="fa-duotone fa-solid fa-chevron-right"></i>
                    </div>
                {/if}
            </a>
        {/each}
    </div>
</div>

<style>
    .workflow-steps {
        container-name: workflow-steps;
        container-type: inline-size;
        width: 100%;
        margin-bottom: 0.5rem;

        @media (min-width: 430px) {
            margin-bottom: 2rem;
        }
    }

    .workflow-steps-container {
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        row-gap: 0.5rem;
        width: 100%;

        @media (min-width: 430px) {
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            column-gap: 1rem;
        }
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

    .step-icon {
        width: 1.25rem;

        @media (min-width: 430px) {
            width: auto;
        }
    }

    .step-text {
        color: var(--primary-300);
        white-space: nowrap;
    }

    .step.completed:not(.selected) {
        .step-text {
            color: var(--primary-900);
        }
    }

    .step.selected {
        .step-text {
            color: var(--accent1-500);
        }
    }

    .step-divider {
        --fa-primary-color: var(--success-900);
        --fa-secondary-color: var(--primary-500);

        display: none;
        margin-left: 0.5rem;

        @media (min-width: 430px) {
            display: block;
        }
    }
</style>