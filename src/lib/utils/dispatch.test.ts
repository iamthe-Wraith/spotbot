import { describe, test, expect, vi, beforeAll } from "vitest";
import { dispatch } from "./dispatch";

describe('dispatch', () => {
    beforeAll(() => {
        // Mock the document object
        global.document = {
            dispatchEvent: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as Document;
    });

    test('should dispatch an event', () => {
        const eventName = 'test-event';
        const eventData = { message: 'test message' };
        
        // Create a spy to listen for the event
        const eventHandler = vi.fn();
        document.addEventListener(eventName, eventHandler);
        
        // Dispatch the event
        dispatch(eventName, eventData);
        
        // Verify the event was dispatched with correct data
        expect(document.dispatchEvent).toHaveBeenCalledTimes(1);
        const dispatchedEvent = (document.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(dispatchedEvent.type).toBe(eventName);
        expect(dispatchedEvent.detail).toEqual(eventData);
        
        // Cleanup
        document.removeEventListener(eventName, eventHandler);
    });
});
