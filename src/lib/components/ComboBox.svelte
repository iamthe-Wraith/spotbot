<script lang="ts" module>
    export interface IComboBoxOption {
        text: string;
        value?: string;
        disabled?: boolean;
        options?: IComboBoxOption[];
    }
</script>

<script lang="ts">
    // original source: https://svelte.dev/playground/144f22d18c6943abb1fdd00f13e23fde
	import { onMount, type Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import InputGroup, { type IInputGroupProps } from "./InputGroup.svelte";
	import { dispatch } from "$lib/utils/dispatch";

    type ComboBoxProps = Omit<IInputGroupProps, 'children'> & HTMLInputAttributes & {
        expand?: boolean;
        loading?: boolean;
        options: IComboBoxOption[];
        selected_option?: IComboBoxOption | null;
        theme?: Theme;
        icon_start?: Snippet<[option: IComboBoxOption | null]>;
        group?: Snippet<[option: IComboBoxOption]>;
        onoptionchange?: (option: IComboBoxOption) => void;
        option?: Snippet<[option: IComboBoxOption]>;
    }

	let {
		disabled,
		error,
		expand,
		id,
		label,
		loading,
		name,
		options = [],
		placeholder,
		readonly,
		required,
        selected_option = $bindable(null),
        text,
        text_position,
        theme = 'primary',
        group,
        icon_start,
        onchange,
        onkeydown,
        onkeyup,
        onmousedown,
        onoptionchange,
        option,
        ...rest_props
	}: ComboBoxProps = $props();

    let list_element: HTMLUListElement | null = $state(null);
    let input_element: HTMLInputElement | null = $state(null);
    let list = $state<IComboBoxOption[]>([]);
    let is_list_open = $state(false);

    $effect(() => {
        if (input_element) {
            if (selected_option && selected_option.value !== '') {
                input_element.value = (selected_option.text as string);
            } else {
                input_element.value = '';
            }
        }
    })

    onMount(() => {
        validate_options(options);

        document.addEventListener('click', hide_list);
        document.addEventListener('combobox-click', on_combobox_click);

        return () => {
            document.removeEventListener('click', hide_list);
            document.removeEventListener('combobox-click', on_combobox_click);
        }
    })

    const filter = (text: string) => {
        const sanitized = text.trim().toLowerCase();
            
        return options.reduce((a, o) => {
            let match: IComboBoxOption | undefined;
            
            if (o.options) {
                const options = o.options.filter((o) => (o.text as string).toLowerCase().includes(sanitized));
                
                if (options.length) {
                    match = { ...o, options }
                }
            } else if ((o.text as string).toLowerCase().includes(sanitized)) {
                match = o;
            }
            
            if (match) a.push(match);
            
            return a;
        }, [] as IComboBoxOption[]);
    };

    const hide_list = () => {
        if (!is_list_open) return;

        if (input_element && selected_option) {
            input_element.value = (selected_option.text as string);
        }

        is_list_open = false;
        input_element?.focus();
    }

    const on_combobox_click = (event: Event) => {
        if (!(event instanceof CustomEvent)) return;

        if (event.detail.id !== id) {
            hide_list();
        }
    }

    const on_input_click = async (event: MouseEvent & { currentTarget: EventTarget & HTMLInputElement; }) => {
        if (!event.target) return;
        await show_list((event.target as HTMLInputElement)?.value);
        dispatch('combobox-click', { id });
        onmousedown?.(event);
    }

    const on_input_keydown = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement; }) => {
        let flag = false;

        switch (event.key) {
            case "Escape":
                hide_list();
                flag = true;
                break;

            case "Tab":
                hide_list();
                break;
            }

        if (flag) {
            event.preventDefault();
            event.stopPropagation();
        }

        onkeydown?.(event);
    }

    const on_input_keyup = async (event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement; }) => {
        switch (event.key) {
            case "Escape":
            case "ArrowUp":
            case "ArrowLeft":
            case "ArrowRight":
            case "Enter":
            case "Tab":
            case "Shift":
                break;
            case "ArrowDown":
                await show_list((event.target as HTMLInputElement)?.value);
                const el: HTMLOptionElement | null | undefined = list_element?.querySelector(`[role="option"]:not([aria-disabled="true"])`);
                el?.focus();

                event.preventDefault();
                event.stopPropagation();
                break;
            default:
                await show_list((event.target as HTMLInputElement)?.value);
        }

        onkeyup?.(event);
    }

    const on_list_keydown = (event: KeyboardEvent) => {
        let flag = false;

        switch (event.key) {
            case "ArrowUp":
                let prevOptionElement = (event.target as HTMLOptionElement).previousElementSibling;

                while (prevOptionElement) {
                    if (prevOptionElement.matches(`[role="option"]:not([aria-disabled="true"])`)) break;
                    prevOptionElement = prevOptionElement.previousElementSibling;
                }

                (prevOptionElement as HTMLOptionElement)?.focus();
                flag = true;
                break;

            case "ArrowDown":
                let nextOptionElement = (event.target as HTMLOptionElement).nextElementSibling;

                while (nextOptionElement) {
                    if (nextOptionElement.matches(`[role="option"]:not([aria-disabled="true"])`)) break;
                    nextOptionElement = nextOptionElement.nextElementSibling;
                }

                (nextOptionElement as HTMLOptionElement)?.focus();
                flag = true;
                break;

            case "Enter":
                select_option(event.target as HTMLOptionElement);
                hide_list();
                flag = true;
                break;

            case "Escape":
                hide_list();
                flag = true;
                break;

            case "Tab":
                hide_list();
                break;

            default:
                input_element?.focus();
        }

        if (flag) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    const on_option_click = (event: MouseEvent) => {
        if (!event.target) return;
        if (!(event.target as HTMLOptionElement).matches(`[role="option"]:not([aria-disabled="true"])`)) return
        select_option(event.target as HTMLOptionElement);
        hide_list();
    }

    const select_option = (option_element: HTMLOptionElement) => {
        selected_option = {
            text: option_element.dataset.text!,
            value: option_element.dataset.value!
        };

        onoptionchange?.(selected_option);
    }

    const show_list = async (input_value: string) => {
        const is_exact_match = options.some((o) =>
            o.options ? o.options.some((o) => o.text === input_value) : o.text === input_value
        );

        list = input_value === "" || is_exact_match ? options : await filter(input_value);
        is_list_open = true;
    }

    const stop_propagation = (node: EventTarget, { name, handler }: { name: string, handler: (event: Event) => void }) => {
        node.addEventListener(name, handler)
        return { destroy: () => node.removeEventListener(name, handler) }
    }

    const validate_options = (opts: IComboBoxOption[]) => {
        if (!Array.isArray(opts)) {
            throw new Error('Options must be an array');
        }

        for (const option of opts) {
            if (!option.text) {
                throw new Error('Options must have a text property');
            }
            
            if (option.options) {
                validate_options(option.options);
            }
        }
    }
</script>

<InputGroup
    {id}
    {label}
    {error}
    {text}
    {text_position}
    {required}
>
    <div class="input-container {theme}">
        {@render icon_start?.(selected_option)}

        <input
            bind:this={input_element}
            onkeyup={on_input_keyup}
            onkeydown={on_input_keydown}
            onmousedown={on_input_click}
            class="combobox-input no-outline"
            {id}
            data-testid={`${id}-input`}
            name="{name}-input"
            {disabled}
            {readonly}
            {placeholder}
            type="text"
            autocapitalize="none"
            autocomplete="off"
            spellcheck="false"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={is_list_open}
            aria-controls={list_element?.id}
            aria-required={required ? "true" : undefined}
            use:stop_propagation={{ name: 'click', handler: (e: Event) => e.stopPropagation() }}
            {...rest_props}
        />

        <input
            type="hidden"
            value={selected_option?.value}
            data-testid={`${id}-selected-option-input`}
            {name}
        />

        <ul
            class="combobox-list"
            role="listbox"
            aria-label={label}
            data-testid={`${id}-list`}
            hidden={!is_list_open}
            onclick={on_option_click}
            onkeydown={on_list_keydown}
            bind:this={list_element}
        >
            {#each list as main_option, index (main_option)}
                {#if main_option.options}
                    <li class="list-option-heading" data-testid={`${id}-option-heading-${index}`}>
                        {#if group}
                            {@render group?.(main_option)}
                        {:else}
                            {main_option.text}
                        {/if}
                    </li>

                    {#each main_option.options as sub_option (sub_option)}
                        <li
                            class="list-option"
                            class:--disabled={sub_option.disabled}
                            role="option"
                            tabindex={sub_option.disabled ? undefined : -1}
                            data-text={sub_option.text}
                            data-value={sub_option.value}
                            data-testid={`${id}-option-${index}`}
                            aria-selected={selected_option?.value === sub_option.value}
                            aria-disabled={sub_option.disabled}
                        >
                            {#if option}
                                {@render option?.(sub_option)}
                            {:else}
                                {sub_option.text}
                            {/if}
                            
                            {#if sub_option.value === selected_option?.value}
                                <i class="fa-duotone fa-light fa-hexagon-check"></i>
                            {/if}
                        </li>
                    {/each}
                {:else}
                    <li
                        class="list-option"
                        class:--disabled={main_option.disabled}
                        role="option"
                        tabindex={main_option.disabled === true ? undefined : -1}
                        data-text={main_option.text}
                        data-value={main_option.value}
                        data-testid={`${id}-option-${index}`}
                        aria-selected={selected_option?.value === main_option.value}
                        aria-disabled={main_option.disabled}
                    >
                        {#if option}
                            {@render option?.(main_option)}
                        {:else}
                            {main_option.text}
                        {/if}
                        
                        {#if main_option.value === selected_option?.value}
                            <i class="fa-duotone fa-light fa-hexagon-check"></i>
                        {/if}
                    </li>
                {/if}
            {:else}
                <li class="list-no-results" data-testid={`${id}-no-results`}>
                    No results available
                </li>
            {/each}
        </ul>
    </div>
</InputGroup>

<style>	
    .input-container {
        position: relative;
        border: 1px solid var(--theme-inactive);
        border-radius: 0.25rem;
        background: transparent;

        &:has(input:focus-visible) {
            border-color: var(--theme-active);
        }
    }

    .primary {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--primary-500);
        --theme-color: var(--neutral-900);
    }

    .accent1 {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--accent1-500);
        --theme-color: var(--neutral-900);
    }

    .accent2 {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--accent2-500);
        --theme-color: var(--neutral-900);
    }

    .accent3 {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--accent3-500);
        --theme-color: var(--neutral-900);
    }

    .neutral {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--neutral-700);
        --theme-color: var(--neutral-900);
    }

    .danger {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--danger-500);
        --theme-color: var(--neutral-900);
    }

    .success {
        --theme-inactive: var(--neutral-300);
        --theme-active: var(--success-500);
        --theme-color: var(--neutral-900);
    }
	
	.combobox-input {
		margin: 0;
		width: 100%;
		padding: 0.5rem 1rem;
        font-size: 1rem;
		color: var(--theme-color);
		border: none;
        border-radius: 0.25rem;
		background-color: var(--neutral-100);
        outline: none;
	}
	
	.combobox:focus-within .combobox-input {
		border-color: var(--primary-500);
	}

    .combobox-list {
		list-style: none;
		margin: 0;
        padding: 0.3rem;
        position: absolute;
        inset-inline-start: 0;
        inset-block-start: calc(100% + 0.3rem);
		min-width: var(--combobox-list-min-width, auto);
		max-width: var(--combobox-list-max-width, auto);
        max-height: var(--combobox-list-max-height, 15rem);
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
        z-index: 100;
    
        background-color: var(--neutral-100);
        border-radius: 0.3em;
		border: 1px solid var(--primary-500);
        box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;    
    }

    .list-option-heading {
        font-size: 0.9em;
        padding-inline: 1rem;
        padding-block-start: 0.4rem;
        color: gray;
    }
	
	.list-no-results {
		padding: 0.8rem 1rem;
	}

    .list-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem;
        padding: 0.5rem 1rem;
        border: 1px solid transparent;
        border-radius: 0.25rem;
    }

    .list-option > :global(*) {
        pointer-events: none;
    }
	
	.list-option.--disabled {
		pointer-events: none;
		opacity: 0.4;
	}

    .list-option:focus,
    .list-option:not([aria-disabled="true"]):hover {
        outline: none;
        cursor: pointer;
        background-color: var(--neutral-200);
    }
	
	.list-option:active {
        cursor: pointer;
        outline: none;
        color: white;
        background-color: var(--primary-500) !important;
    }

    .list-option:focus :global(svg),
    .list-option:hover :global(svg) {
        --icon-color: var(--neutral-900) !important;
    }
</style>
    