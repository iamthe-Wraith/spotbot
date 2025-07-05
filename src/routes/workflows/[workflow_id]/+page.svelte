<script lang="ts">
	import { page } from "$app/state";
	import { db, type IWorkflow } from "$lib/state/db.svelte";
    import { onMount } from "svelte";

    let workflow = $state<IWorkflow | null>(null);
    let error = $state('');

    onMount(async () => {
        load_workflow();
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
</script>

<div>
    {#if error}
        <p class="error">{error}</p>
    {:else if workflow}
        <h1>{workflow.name}</h1>
        <p>{workflow.description}</p>
        <p>{workflow.confidence_threshold}</p>
    {:else}
        <p>Loading workflow...</p>
    {/if}
</div>