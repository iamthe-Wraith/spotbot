<script lang="ts">
    import { onMount } from "svelte";
    import dayjs from "dayjs";
    import utc from "dayjs/plugin/utc";
    import Button from "../Button.svelte";
    import Modal from "./Modal.svelte";
	import { dispatch } from "$lib/utils/dispatch";
	import { CLOSE_MODAL_EVENT, MODAL_CHANGE_EVENT, OPEN_MODAL_EVENT, WORKFLOW_CREATED_EVENT, WORKFLOW_UPDATED_EVENT } from "$lib/constants/custom-events";
	import { DEFAULT_CONFIDENCE_THRESHOLD } from "$lib/constants/workflow";
	import { db, WORKFLOW_STATUS, type IWorkflow } from "$lib/state/db.svelte";
	import TextInput from "../TextInput.svelte";
	import Textarea from "../Textarea.svelte";
	import NumberInput from "../NumberInput.svelte";
	import { toast } from "$lib/state/toast.svelte";
	import { goto } from "$app/navigation";

    dayjs.extend(utc);

    interface INewActionModalProps {
        oncancel?: () => void;
        oncomplete?: (workflow: IWorkflow) => void;
    }

    let {
        oncancel = () => {},
        oncomplete = (workflow: IWorkflow) => {},
    }: INewActionModalProps = $props();

    let processing = $state(false);

    let workflow = $state<IWorkflow | null>(null);

    let name = $state('');
    let description = $state('');
    let confidence_threshold = $state(DEFAULT_CONFIDENCE_THRESHOLD);

    let name_error = $state('');
    let description_error = $state('');
    let confidence_threshold_error = $state('');
    let error = $state('');

    let disabled = $derived(!!name_error || !!description_error || !!confidence_threshold_error || !!error || processing);

    const modal_id = 'manage-workflow-modal';

    onMount(() => {
        reset();
        document.addEventListener(MODAL_CHANGE_EVENT, on_modal_change);
        document.addEventListener(OPEN_MODAL_EVENT, on_modal_open);

        return () => {
            reset();
            document.removeEventListener(MODAL_CHANGE_EVENT, on_modal_change);
            document.removeEventListener(OPEN_MODAL_EVENT, on_modal_open);
        };
    })

    const on_cancel_click = () => {
        reset();
        oncancel?.();

        dispatch(CLOSE_MODAL_EVENT, { id: modal_id });
    }

    const on_modal_change = (e: Event) => {
        if (
            e instanceof CustomEvent &&
            (e as CustomEvent).detail.id === modal_id &&
            !(e as CustomEvent).detail.open
        ) {
            reset();
            oncancel?.();
        }
    }

    const on_modal_open = (e: Event) => {
        if (
            e instanceof CustomEvent &&
            (e as CustomEvent).detail.id === modal_id
        ) {
            if (e.detail.workflow) {
                workflow = e.detail.workflow;
                name = workflow?.name ?? '';
                description = workflow?.description ?? '';
                confidence_threshold = workflow?.confidence_threshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
            }
        }
    }

    const on_submit = async (event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement}) => {
		event.preventDefault();

        console.log('creating workflow', workflow, name, description, confidence_threshold);

        try {
            const now = dayjs.utc().toISOString();
            const data: IWorkflow = !!workflow
                ? {
                    ...workflow,
                    name,
                    description,
                    confidence_threshold,
                    updated_at: now,
                }
                : {
                    id: crypto.randomUUID(),
                    name,
                    description,
                    confidence_threshold,
                    status: WORKFLOW_STATUS.CREATED,
                    created_at: now,
                    updated_at: now,
                };
            
            const id = await db.workflows.add(data);

            console.log('>>>>> workflow created', data, id);

            reset();
            oncomplete?.(data);

            dispatch(CLOSE_MODAL_EVENT, { id: modal_id });
            dispatch(workflow ? WORKFLOW_UPDATED_EVENT : WORKFLOW_CREATED_EVENT, { workflow: data });

            toast.add({
                message: `Workflow ${name} successfully ${workflow ? 'updated' : 'created'}.`,
                type: 'success',
            });

            goto(`/workflows/${id}`);
        } catch (error) {
            error = `Failed to ${workflow ? 'update' : 'create'} workflow: ${error}`;
        }
    }

    const reset = () => {
        workflow = null;
        name = '';
        description = '';
        confidence_threshold = DEFAULT_CONFIDENCE_THRESHOLD;
        name_error = '';
        description_error = '';
        confidence_threshold_error = '';
        description_error = '';
        error = '';
        processing = false;
    }
</script>

<Modal
    id={modal_id}
    title="{workflow ? 'Edit' : 'Create'} Workflow"
    style="--modal-max-width: 30rem;"
>
    {#snippet modal_contents()}
        <form
            data-testid="workflow-form"
            method="POST" 
            onsubmit={on_submit}
        >
            <TextInput
                required
                autofocus
                id="workflow-name"
                name="name"
                data-testid="workflow-name"
                label="Name"
                placeholder="Workflow Name"
                error={name_error}
                bind:value={name}
            />

            <Textarea
                id="workflow-description"
                name="description"
                data-testid="workflow-description"
                label="Description"
                placeholder="Workflow Description"
                error={description_error}
                bind:value={description}
            />

            <NumberInput
                required
                id="workflow-confidence-threshold"
                name="confidence_threshold"
                data-testid="workflow-confidence-threshold"
                label="Confidence Threshold"
                text="The minimum confidence score for a workflow to be considered a match. 0 = "
                placeholder="Confidence Threshold"
                step={0.01}
                min={0}
                max={1}
                error={confidence_threshold_error}
                bind:value={confidence_threshold}
            />

            {#if error}
                <p class="error" data-testid="new-action-gen-error">{error}</p>
            {/if}

            <footer>                
                <div class="buttons-container">
                    <Button
                        id="workflow-create"
                        data-testid="workflow-create"
                        theme="primary"
                        type="submit"
                        {disabled}
                        {processing}
                    >
                        {workflow ? 'Update' : 'Create'}
                    </Button>
                
                    <Button
                        id="workflow-cancel"
                        data-testid="workflow-cancel"
                        theme="transparent"
                        type="button"
                        onclick={on_cancel_click}
                    >
                        Cancel
                    </Button>
                </div>
            </footer>
        </form>
    {/snippet}
</Modal>

<style>
    form {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;

        @media (min-width: 500px) {
            gap: 1rem;
        }
    }

    .error {
        margin: 0;
    }

    footer {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .buttons-container {
        display: flex;
        flex-direction: row-reverse;
        justify-content: flex-start;
        align-items: center;
        gap: 1rem;
        padding: 0 var(--outline-offset);
    }
</style>