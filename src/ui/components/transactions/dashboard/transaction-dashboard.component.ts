import { Component, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, NotificationService, SharedModule } from '@vendure/admin-ui/core';
import dayjs from 'dayjs';
import { map, shareReplay } from 'rxjs/operators';

import {
	GenericSummaryWidgetComponent,
	SummaryStat,
} from '../../commun/dashboard/generic-summary-widget/generic-summary-widget.component';
import { CustomChartComponent } from '../../commun/custom-chart/custom-chart.component';
import { GET_TRANSACTION_ENTRY_SUMMARY } from '../../../graphql/dashbord.graphql';
import { ChartEntry, ChartFormatOptions } from '../constantes/chart';
import {DateRangePickerComponent} from "../../commun/date-range-picker/date-range-picker.component";

@Component({
	selector: 'transaction-dashboard',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		SharedModule,
		GenericSummaryWidgetComponent,
		CustomChartComponent,
		DateRangePickerComponent
	],
	templateUrl: './transaction-dashboard.component.html',
	styleUrls: ['./transaction-dashboard.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionDashboardComponent implements OnInit {
	readonly stats = signal<SummaryStat[]>([]);
	readonly metricsDebit = signal<ChartEntry[]>([]);
	readonly metricsCredit = signal<ChartEntry[]>([]);
	readonly metricsDiff = signal<ChartEntry[]>([]);
	readonly startDate = signal<string>(dayjs().format('YYYY-MM-DD'));
	readonly endDate = signal<string>(dayjs().format('YYYY-MM-DD'));

	myOptions = {
		showGridBackground: true,
	};

	constructor(
		private dataService: DataService,
		private notificationService: NotificationService,
	) {}

	ngOnInit(): void {
		this.fetchSummary();
	}

	updateStartDate(value: string): void {
		this.startDate.set(value);
		this.fetchSummary();
	}

	updateEndDate(value: string): void {
		this.endDate.set(value);
		this.fetchSummary();
	}

	setToday(): void {
		const today = dayjs();
		this.startDate.set(today.format('YYYY-MM-DD'));
		this.endDate.set(today.format('YYYY-MM-DD'));
		this.fetchSummary();
	}

	setYesterday(): void {
		const y = dayjs().subtract(1, 'day');
		this.startDate.set(y.format('YYYY-MM-DD'));
		this.endDate.set(y.format('YYYY-MM-DD'));
		this.fetchSummary();
	}

	setThisMonth(): void {
		const start = dayjs().startOf('month');
		const end = dayjs().endOf('month');
		this.startDate.set(start.format('YYYY-MM-DD'));
		this.endDate.set(end.format('YYYY-MM-DD'));
		this.fetchSummary();
	}

	setThisYear(): void {
		const start = dayjs().startOf('year');
		const end = dayjs().endOf('year');
		this.startDate.set(start.format('YYYY-MM-DD'));
		this.endDate.set(end.format('YYYY-MM-DD'));
		this.fetchSummary();
	}

	private fetchSummary(): void {
		const start = dayjs(this.startDate()).startOf('day').toISOString();
		const end = dayjs(this.endDate()).endOf('day').toISOString();

		this.dataService
			.query(GET_TRANSACTION_ENTRY_SUMMARY, { start, end, take: 1000 })
			.refetchOnChannelChange()
			.mapStream(data => data.transactionEntries)
			.pipe(
				shareReplay(1),
				map(res => {
					const items = [...res.items].sort(
						(a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime()
					);

					const totalDebit = items
						.filter(e => e.typeEntry === 'DEBIT')
						.reduce((sum, e) => sum + e.amount, 0);
					const totalCredit = items
						.filter(e => e.typeEntry === 'CREDIT')
						.reduce((sum, e) => sum + e.amount, 0);

					const fmt: ChartFormatOptions = {
						formatValueAs: 'number',
						currencyCode: 'USD',
						locale: 'en-US',
					};

					this.stats.set([
						{ label: 'Total Entries', value: res.totalItems },
						{ label: 'Total Debit',   value: totalDebit },
						{ label: 'Total Credit',  value: totalCredit },
						{ label: 'Difference',    value: totalCredit - totalDebit },
					]);

					this.metricsDebit.set(
						items
							.filter(e => e.typeEntry === 'DEBIT')
							.map(e => ({ label: e.dateTransaction, value: e.amount, formatOptions: fmt }))
					);

					this.metricsCredit.set(
						items
							.filter(e => e.typeEntry === 'CREDIT')
							.map(e => ({ label: e.dateTransaction, value: e.amount, formatOptions: fmt }))
					);

					this.metricsDiff.set(
						items.map(e => ({
							label: e.dateTransaction,
							value: e.typeEntry === 'CREDIT' ? e.amount : -e.amount,
							formatOptions: fmt,
						}))
					);
				}),
			)
			.subscribe({
				error: () =>
					this.notificationService.error('Erreur chargement dashboard'),
			});
	}

	onDateRangeChange(range: { start: string; end: string }): void {
		this.startDate.set(range.start);
		this.endDate.set(range.end);
		this.fetchSummary();
	}
}
