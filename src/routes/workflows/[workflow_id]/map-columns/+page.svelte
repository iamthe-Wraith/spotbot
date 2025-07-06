<script lang="ts">
	import { onMount } from "svelte";
	import dayjs from "dayjs";
    import utc from "dayjs/plugin/utc";
    import { page } from "$app/state";
	import Button from "$lib/components/Button.svelte";
	import Checkbox from "$lib/components/Checkbox.svelte";
	import ComboBox, { type IComboBoxOption } from "$lib/components/ComboBox.svelte";
	import Link from "$lib/components/Link.svelte";
	import WithTooltip from "$lib/components/WithTooltip.svelte";
    import WorkflowSteps from "$lib/components/WorkflowSteps.svelte";
	import { db, WORKFLOW_STATUS, type IWorkflow, type IWorkflowColumnMapping, type IWorkflowFile } from "$lib/state/db.svelte";
	import { toast } from "$lib/state/toast.svelte";

    dayjs.extend(utc);

    interface IFiles {
        base: IWorkflowFile | null;
        updated: IWorkflowFile | null;
    }
    
    interface IMapping {
        match: boolean;
        base_column: string;
        updated_column_option: IComboBoxOption;
    }
    
    let workflow = $state<IWorkflow | null>(null);
    let files = $state<IFiles>({
        base: null,
        updated: null,
    });
    let mappings = $state<IMapping[]>([]);

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
        await load_column_mappings();
    });

    const load_column_mappings = async () => {
        try {
            if (workflow && files.base && files.updated && !error) {
                const stored_mappings = await db.workflow_column_mappings.where('workflow_id')
                    .equals(workflow.id)
                    .toArray();

                for (const column of files.base.columns) {
                    const mapping = stored_mappings.find(m => m.base_column === column);

                    if (mapping) {
                        mappings.push({
                            match: mapping.match,
                            base_column: mapping.base_column,
                            updated_column_option: options.find(o => o.value.toLocaleLowerCase() === mapping.updated_column.toLocaleLowerCase()) ?? {
                                value: '',
                                text: mapping.updated_column,
                            },
                        });
                    } else {
                        mappings.push({
                            match: false,
                            base_column: column,
                            updated_column_option: options.find(o => o.value.toLocaleLowerCase() === column.toLocaleLowerCase()) ?? {
                                value: '',
                                text: column,
                            },
                        });
                    }
                }
            }
        } catch (err) {
            error = `Failed to load column mappings: ${(err as Error).message}`
        }
    }

    const load_workflow = async () => {
        try {
            const workflow_id = page.params.workflow_id;
        
            const wf = await db.workflows.get(workflow_id);

            if (wf) {
                workflow = wf;
            } else {
                error = 'Workflow not found';
            }
        } catch (err: unknown) {
            error = `Failed to load workflow: ${(err as Error).message}`;
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
        } catch (err: unknown) {
            error = `Failed to load workflow files: ${(err as Error).message}`;
        }
    }

    const on_map_columns = async (e: Event) => {
        e.preventDefault();
        
        error = '';

        try {
            await db.workflow_column_mappings.where('workflow_id')
                .equals(workflow!.id)
                .delete();

            let at_least_one_match = false;
            let at_least_one_updated_column = false;

            console.log('>>>>> mappings: ', $state.snapshot(mappings));

            for (const mapping of mappings ?? []) {
                // const raw_match = form_data.get(`column-${mapping.base_column}-match`) as string;
                // const match = raw_match === 'on';
                // const updated_column = form_data.get(`updated-column-${mapping.base_column}`) as string;

                const now = dayjs.utc().toISOString();

                if (mapping.match) {
                    at_least_one_match = true;
                }

                if (mapping.updated_column_option.value) {
                    at_least_one_updated_column = true;
                }

                if (mapping.match && !mapping.updated_column_option.value) {
                    error = 'Columns must be mapped in order to enabled matching';
                    return;
                }

                await db.workflow_column_mappings.add({
                    workflow_id: workflow!.id,
                    base_column: mapping.base_column,
                    updated_column: mapping.updated_column_option.value || '',
                    match: mapping.match,
                    created_at: now,
                    updated_at: now,
                });
            }

            if (!at_least_one_updated_column) {
                error = 'At least one set of columns must be mapped';
                return;
            }
            
            if (!at_least_one_match) {
                error = 'At least one set of columns must have matching enabled';
                return;
            }

            await db.workflow_matches.where('workflow_id')
                .equals(workflow!.id)
                .delete();

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
            <section class="column-mapping-description">
                <h1>{workflow.name} - Map Columns</h1>

                <p>
                    Map the columns of the 2 different files to each other. When mapped, the base file's column will
                    be updated with the corresponding column from the updated file for rows that are matched.
                </p>

                <p>
                    If a column is not mapped, it will be ignored during processing.
                </p>

                <p>
                    <b>Note:</b> If you are not sure about the mapping, you can always change it later.
                </p>
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
                                        text="The base and updated column values must have a similarity score greater than or equal to your configured threshold during processing to be considered a match. Otherwise, the columns will not be compared."
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
                        {#each mappings as mapping}
                            <div class="column-mapping-row">
                                <div class="column-mapping-row-left">
                                    <div class="column-match-column">
                                        <Checkbox
                                            id="column-{mapping.base_column}-match"
                                            name="column-{mapping.base_column}-match"
                                            bind:checked={mapping.match}
                                        />
                                    </div>

                                    <div class="column-name">
                                        { mapping.base_column }
                                    </div>
                                </div>

                                <div>
                                    <ComboBox
                                        id="updated-column-{mapping.base_column}"
                                        name="updated-column-{mapping.base_column}"
                                        options={options}
                                        bind:selected_option={mapping.updated_column_option}
                                        placeholder="Select a Column"
                                    />
                                </div>
                            </div>
                        {/each}

                        {#if error}
                            <div class="error">
                                {error}
                            </div>
                        {/if}

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
                            href={columns_mapped ? `/workflows/${workflow.id}/review-data` : '#'}
                            theme="primary"
                        >
                            Review Data
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
    .workflow-container {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 1rem;
        height: 100%;
    }

    .column-mapping-description p:last-child {
        margin-bottom: 0;
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

    .error {
        margin-top: 1rem;
        text-align: center;
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