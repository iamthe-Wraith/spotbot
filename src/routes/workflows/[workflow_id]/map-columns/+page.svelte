<script lang="ts">
	import { onMount } from "svelte";
	import dayjs from "dayjs";
    import utc from "dayjs/plugin/utc";
    import { page } from "$app/state";
	import Button from "$lib/components/Button.svelte";
	import Checkbox from "$lib/components/Checkbox.svelte";
	import ComboBox from "$lib/components/ComboBox.svelte";
	import Link from "$lib/components/Link.svelte";
	import WithTooltip from "$lib/components/WithTooltip.svelte";
    import WorkflowSteps from "$lib/components/WorkflowSteps.svelte";
	import { db, WORKFLOW_STATUS, type IWorkflow, type IWorkflowFile } from "$lib/state/db.svelte";
	import { toast } from "$lib/state/toast.svelte";

    dayjs.extend(utc);

    interface IFiles {
        base: IWorkflowFile | null;
        updated: IWorkflowFile | null;
    }
    
    let workflow = $state<IWorkflow | null>(null);
    let files = $state<IFiles>({
        base: null,
        updated: null,
    });

    let options = $derived.by(() => {
        if (!files.updated?.columns) {
            return [];
        }

        const options = files.updated?.columns?.map(c => ({
            value: c,
            text: c,
        }));

        return [
            {
                value: '',
                text: 'Select a Column',
            },
            ...options,
        ]
    });

    let columns_mapped = $derived.by(() => {
        if (!workflow) {
            return false;
        }

        return workflow.status !== WORKFLOW_STATUS.CREATED &&
            workflow.status !== WORKFLOW_STATUS.FILES_UPLOADED;
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

    const on_map_columns = async (e: Event) => {
        e.preventDefault();

        const form_data = new FormData(e.target as HTMLFormElement);

        try {
            await db.workflow_column_mappings.where('workflow_id')
                .equals(workflow!.id)
                .delete();

            for (const column of files.base?.columns ?? []) {
                const raw_match = form_data.get(`column-${column}-match`) as string;
                const match = raw_match === 'on';
                const updated_column = form_data.get(`updated-column-${column}`) as string;

                const now = dayjs.utc().toISOString();

                await db.workflow_column_mappings.add({
                    workflow_id: workflow!.id,
                    base_column: column,
                    updated_column,
                    match,
                    created_at: now,
                    updated_at: now,
                });
            }

            workflow!.status = WORKFLOW_STATUS.COLUMNS_MAPPED;
            await db.workflows.put($state.snapshot(workflow!));

            toast.add({
                message: 'Columns mapped successfully',
                type: 'success',
            });
        } catch (err: unknown) {
            error = `Failed to map columns: ${err}`;
        }
    }
</script>

<div class="workflow-container">
    {#if workflow}
        <WorkflowSteps {workflow} />

        {#if workflow.status === WORKFLOW_STATUS.CREATED}
            <section>
                You must upload the base and updated files before mapping columns.

                <Link href="/workflows/{workflow.id}" theme="primary">
                    Upload Files
                </Link>
            </section>
        {:else}
            <section>
                <h1>{workflow.name} - Map Columns</h1>
            </section>

            <section class="column-mapping-container">
                <form
                    method="POST"
                    onsubmit={on_map_columns}
                >
                    {#if files.base && files.updated}
                        <div class="column-mapping-row">
                            <div class="column-mapping-row-left">
                                <div class="column-match-column">
                                    Match
                                    <WithTooltip 
                                        id="column-match-tooltip"
                                        text="The base and updated column values must have a similarity within the requirement threshold during processing to be considered a match. Otherwise, the columns will not be compared."
                                        position="top"
                                        align="start"
                                    >
                                        <i class="fa-duotone fa-regular fa-circle-info"></i>
                                    </WithTooltip>
                                </div>
    
                                <div>
                                    Base Columns
                                </div>
                            </div>

                            <div>
                                Updated Columns
                            </div>
                        </div>
                        {#each files.base.columns as column}
                            <div class="column-mapping-row">
                                <div class="column-mapping-row-left">
                                    <div class="column-match-column">
                                        <Checkbox
                                            id="column-{column}-match"
                                            name="column-{column}-match"
                                        />
                                    </div>

                                    <div class="column-name">
                                        { column }
                                    </div>
                                </div>

                                <div>
                                    <ComboBox
                                        id="updated-column-{column}"
                                        name="updated-column-{column}"
                                        options={options}
                                        selected_option={options?.find(c => c.value.toLocaleLowerCase() === column.toLocaleLowerCase())}
                                        placeholder="Select a Column"
                                    />
                                </div>
                            </div>
                        {/each}

                        <div class="buttons-container">
                            <Button
                                type="submit"
                                theme="primary"
                            >
                                Map Columns
                            </Button>
                        </div>
                    {/if}
                </form>

                <div class="controls-container">
                    <Link
                        href="/workflows/{workflow.id}"
                        theme="primary-text"
                    >
                        Back to Files Upload
                    </Link>

                    <span class:disabled={!columns_mapped}>
                        <Link
                            href={columns_mapped ? `/workflows/${workflow.id}/process-data` : '#'}
                            theme="primary"
                        >
                            Process Data
                        </Link>
                    </span>
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

    .column-mapping-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
        margin-top: 1rem;
    }

    .column-mapping-container form {
        width: 100%;
        max-width: 50rem;
        margin: 0 auto;
    }

    .column-mapping-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid var(--primary-200);

        & > * {
            flex: 1;
        }

        @media (max-width: 768px) {
            padding: 0.5rem 0;
        }
    }

    .column-mapping-row-left {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 1rem;
        min-width: 45%;
    }

    .column-match-column {
        --fa-primary-color: var(--primary-400);
        --fa-secondary-color: var(--primary-100);

        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 0.3rem;
        min-width: 4rem;
        max-width: 4rem;
    }

    .column-name {
        flex: 1;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .buttons-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1rem;
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