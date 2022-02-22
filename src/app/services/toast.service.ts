import {Injectable} from '@angular/core';
import {ToastrService} from "ngx-toastr";


@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private readonly LIFETIME: number = 10000;
    constructor(private toastr: ToastrService) { }

    public toast(severity: ToastType = ToastType.Info, title: string, message?: string, lifetime: number = this.LIFETIME, dismissible: boolean = true) {
        this.toastr.show(
            message,
            title,
            {
                timeOut: lifetime,
                tapToDismiss: dismissible,
                progressBar: severity === ToastType.Success,
                positionClass: 'toast-bottom-right',
                enableHtml: true
            },
            severity
        );
    }

    public clear() {
        this.toastr.clear();
    }
}

export enum ToastType {
    Info = 'toast-info',
    Success = 'toast-success',
    Warn = 'toast-warn',
    Error = 'toast-error'
}
