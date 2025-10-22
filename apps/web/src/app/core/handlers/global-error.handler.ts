import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
    private toast = inject(ToastService);
    handleError(error: unknown): void {
        this.toast.error('Oups, quelque chose s’est mal passé.');
        console.error(error);
    }
}
