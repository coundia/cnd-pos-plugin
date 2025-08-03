import { ChangeDetectionStrategy, Component } from '@angular/core';
import {DataService, NotificationService, SharedModule} from '@vendure/admin-ui/core';
import {TransactionEntryListComponent} from "../list/transaction-entry-list.component";
import {TransactionDashboardComponent} from "../dashboard/transaction-dashboard.component";
import {SYNC_INCREMENTAL} from "../../sync/sync.graphql";

@Component({
	selector: 'app-transaction-index',
	templateUrl: './transaction-index.html',
	styleUrls: ['./transaction-index.scss'],
	standalone: true,
	imports: [
		SharedModule,
		TransactionEntryListComponent,
		TransactionDashboardComponent
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionIndexComponent {

	constructor(
		private dataService: DataService,
		private notificationService: NotificationService,
	) {}

	onSync() {
		this.dataService
			.mutate(SYNC_INCREMENTAL, {})
			.subscribe({
				next: (res) => {
					this.notificationService.success(
						'Sync started',
					);
					console.log(res);
				},
				error: err => {
					this.notificationService.error(
						'Sync failed',
						err.message || 'See console for details.',
					);
					console.log(err);
				}
			});
	}
}
