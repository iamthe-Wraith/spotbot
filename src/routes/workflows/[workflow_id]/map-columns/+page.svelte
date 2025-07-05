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

        {#if workflow.status === WORKFLOW_STATUS.CREATED}
            <div>
                You must upload the base and updated files before mapping columns.

                <Link href="/workflows/{workflow.id}" theme="primary">
                    Upload Files
                </Link>
            </div>
        {:else}
            <div class="map-columns-container">
                <h1>Map Columns</h1>
            </div>
        {/if}
    {:else}

    {/if}
</div>