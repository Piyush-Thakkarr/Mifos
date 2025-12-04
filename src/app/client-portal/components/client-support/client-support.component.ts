import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'mifosx-client-support',
    templateUrl: './client-support.component.html',
    styleUrls: ['./client-support.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule]
})
export class ClientSupportComponent implements OnInit {
    clientId: string = '';

    // Form data
    subject: string = '';
    category: string = 'general';
    message: string = '';
    submitted: boolean = false;

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        const idParam = this.route.parent?.snapshot.paramMap.get('clientId') ||
            this.route.snapshot.paramMap.get('clientId');
        this.clientId = idParam ?? '';
    }

    submitRequest(): void {
        if (this.subject && this.message) {
            // In a real app, this would call an API
            console.log('Support request submitted:', {
                subject: this.subject,
                category: this.category,
                message: this.message
            });

            this.submitted = true;

            // Reset form after 3 seconds
            setTimeout(() => {
                this.subject = '';
                this.category = 'general';
                this.message = '';
                this.submitted = false;
            }, 3000);
        }
    }
}
