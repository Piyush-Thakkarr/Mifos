import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ClientApiService } from '../../services/client-api.service';

@Component({
    selector: 'mifosx-client-layout',
    templateUrl: './client-layout.component.html',
    styleUrls: ['./client-layout.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterModule]
})
export class ClientLayoutComponent implements OnInit {
    clientId: string = '';
    client: any = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private clientApi: ClientApiService
    ) { }

    ngOnInit(): void {
        // Get clientId from the parent route (portal/:clientId)
        this.route.paramMap.subscribe(params => {
            this.clientId = params.get('clientId') || '';
            if (this.clientId) {
                this.fetchClientDetails();
            }
        });
    }

    fetchClientDetails(): void {
        this.clientApi.getClient(this.clientId).subscribe({
            next: (data) => {
                // Extract client details from nested structure
                this.client = data?.details || data;
            },
            error: (err) => console.error('Layout fetch error:', err)
        });
    }
}
