export const dispatch = <T>(event_name: string, data?: T) => {
    const event = new CustomEvent(event_name, { detail: data });
    document.dispatchEvent(event);
}