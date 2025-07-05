<script lang="ts">
	import { page } from "$app/state";
	import Link from "$lib/components/Link.svelte";
	import WorkflowSteps from "$lib/components/WorkflowSteps.svelte";
	import { db, WORKFLOW_STATUS, type IWorkflow, type IWorkflowFile } from "$lib/state/db.svelte";
	import { onMount } from "svelte";

    interface IFiles {
        base: IWorkflowFile | null;
        updated: IWorkflowFile | null;
    }
    
    let workflow = $state<IWorkflow | null>(null);
    let files = $state<IFiles>({
        base: null,
        updated: null,
    });

    let error = $state('');

    onMount(async () => {
        await load_workflow();
        await load_workflow_files();
    });

    const load_workflow = async () => {
        try {
            const workflow_id = page.params.workflow_id;
        
            const wf = await db.workflows.get(workflow_id);

            if (wf) {
                workflow = wf;
            } else {
                error = 'Workflow not found';
            }
        } catch (e) {
            error = `Failed to load workflow: ${e}`;
        }
    }

    const load_workflow_files = async () => {
        try {
            if (workflow) {
                const workflow_files = await db.workflow_files.where('workflow_id')
                    .equals(workflow.id)
                    .toArray();

                if (workflow_files.length > 0) {
                    files.base = workflow_files.find(f => f.workflow_file_type === 'base') ?? null;
                    files.updated = workflow_files.find(f => f.workflow_file_type === 'updated') ?? null;
                }
            }
        } catch (e) {
            error = `Failed to load workflow files: ${e}`;
        }
    }
</script>

<div class="workflow-container">
    {#if workflow}
        <WorkflowSteps {workflow} />

        {#if workflow.status === WORKFLOW_STATUS.CREATED || workflow.status === WORKFLOW_STATUS.FILES_UPLOADED}
            <section>
                You must upload the base and updated files and map their columns before processing data.

                <div class="previous-controls-container">
                    <Link href="/workflows/{workflow.id}" theme="primary">
                        Upload Files
                    </Link>

                    <Link href="/workflows/{workflow.id}/map-columns" theme="primary">
                        Map Columns
                    </Link>
                </div>
            </section>
        {:else}
            <section>
                <h1>{workflow.name} - Process Data</h1>
            </section>

            <section class="process-data-container">
                <div>...</div>

                <div class="controls-container">
                    <Link
                        href="/workflows/{workflow.id}/map-columns"
                        theme="primary-text"
                    >
                        Back to Column Mapping
                    </Link>

                    <div>view results...</div>
                </div>
            </section>
        {/if}
    {:else}
        <p>Loading workflow...</p>
    {/if}
</div>

<style>
    h1 {
        margin-bottom: 0;
    }

    .workflow-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
    }

    .process-data-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
        margin-top: 1rem;
    }

    .controls-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 1rem;

        .disabled {
            opacity: 0.5;
            pointer-events: none;
        }
    }
</style>