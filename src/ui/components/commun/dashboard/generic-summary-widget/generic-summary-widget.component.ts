import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { SharedModule } from '@vendure/admin-ui/core';

export interface SummaryStat {
	label: string;
	value: number;
}

@Component({
	selector: 'generic-summary-widget',
	templateUrl: './generic-summary-widget.component.html',
	styleUrls: ['./generic-summary-widget.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [SharedModule],
})
export class GenericSummaryWidgetComponent {
	@Input() stats: SummaryStat[] = [];
}
