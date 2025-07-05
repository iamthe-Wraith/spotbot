<script lang="ts">
	import Button from "$lib/components/Button.svelte";
	import Link from "$lib/components/Link.svelte";
	import ManageWorkflowModal from "$lib/components/modals/ManageWorkflowModal.svelte";
	import Pill from "$lib/components/Pill.svelte";
	import WorkflowItem from "$lib/components/WorkflowItem.svelte";
	import { OPEN_MODAL_EVENT } from "$lib/constants/custom-events";
	import { db, WORKFLOW_STATUS } from "$lib/state/db.svelte";
	import { dispatch } from "$lib/utils/dispatch";
	import { liveQuery } from "dexie";
	import { onMount } from "svelte";

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('new') === 'true') {
            on_create_workflow();
        }
    });

    // Dexie currently uses stores instead of state
    // TODO: update this once Dexie supports Svelte5 $state
    let workflows = liveQuery(
        () => db.workflows.orderBy('created_at').reverse().toArray()
    ); 

    const on_create_workflow = () => {
        dispatch(OPEN_MODAL_EVENT, { id: 'manage-workflow-modal' });
    };
</script>

<div>
    <h1>Workflows</h1>

    <div class="workflows">
        {#if !$workflows}
            <div class="loading flex-center">
                Loading workflows...
            </div>
        {:else}
            {#each $workflows as workflow (workflow.id)}
                <WorkflowItem {workflow} />
            {:else}
                <div class="empty-state flex-center">
                    <div class="h2">
                        No workflows found
                    </div>
                    <Button
                        onclick={on_create_workflow}
                    >
                        Create new workflow
                    </Button>
                </div>
            {/each}

            <div class="workflow-actions">
                <Button
                    onclick={on_create_workflow}
                    theme="primary"
                >
                    Create new workflow
                </Button>
            </div>
        {/if}
    </div>

    <ManageWorkflowModal />
</div>

<style>
    .loading {
        height: 10rem;
    }

    .workflows {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        padding: 0;
        margin: 0;
        list-style: none;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        height: 40vh;
    }

    .workflow-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
    }
</style>