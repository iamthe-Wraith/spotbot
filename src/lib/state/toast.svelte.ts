type ToastType = 'success' | 'danger' | 'primary' | 'accent1' | 'neutral';

interface IRedirect {
    url: string;
    text: string;
    target?: '_blank';
}

interface IToastRequest {
    message: string;
    icon?: string;
    redirect?: IRedirect;
    type?: ToastType;
    duration?: number;
}

export interface IToast {
    id: string,
    message: string;
    icon?: string;
    type: ToastType;
    exp: number;
    redirect: IRedirect | null;
}

class Toast {
	public messages: IToast[] = $state([]);

    private _interval?: number;

    private readonly default_duration = 6500;

	constructor() {
		this.messages = [];
	}

	public reset = () => {
		this.messages = [];
        clearInterval(this._interval);
        this._interval = undefined;
	}

	public add = (request: IToastRequest) => {
        let default_icon: string;

        if (request.type === 'success') {
            default_icon = 'fa-duotone fa-solid fa-party-horn';
        } else if (request.type === 'danger') {
            default_icon = 'fa-duotone fa-solid fa-skull-crossbones';
        } else {
            default_icon = 'fa-duotone fa-solid fa-party-horn';
        }

        const icon = request.icon ?? default_icon;

		this.messages.push({
			id: crypto.randomUUID(),
			message: request.message,
			type: request.type || 'success',
			icon,
			exp: Date.now() + (request.duration || this.default_duration),
			redirect: request.redirect || null,
		});

        if (this._interval === undefined) {
            this._interval = window.setInterval(this.tick, 100);
        }
	}

    public remove = (id: string) => {
        this.messages = this.messages.filter(message => message.id !== id);
    }

    private tick = () => {
        this.messages = this.messages.filter(message => message.exp > Date.now());

        if (this.messages.length === 0) {
            clearInterval(this._interval);
            this._interval = undefined;
        }
    }
}

export const toast = $state(new Toast());
