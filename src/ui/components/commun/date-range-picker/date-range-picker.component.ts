import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import dayjs from 'dayjs';

@Component({
	selector: 'app-date-range-picker',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './date-range-picker.component.html',
	styleUrls: ['./date-range-picker.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangePickerComponent {
	@Input() startDate = dayjs().format('YYYY-MM-DD');
	@Input() endDate   = dayjs().format('YYYY-MM-DD');
	@Output() rangeChange = new EventEmitter<{ start: string; end: string }>();

	// ← nouveau
	activePreset: 'today' | 'yesterday' | 'month' | 'year' | null = null;

	onStartDateChange(value: string): void {
		this.startDate = value;
		this.activePreset = null;           // clear
		this.emitRange();
	}

	onEndDateChange(value: string): void {
		this.endDate = value;
		this.activePreset = null;           // clear
		this.emitRange();
	}

	setToday(): void {
		const today = dayjs();
		this.startDate = today.format('YYYY-MM-DD');
		this.endDate   = today.format('YYYY-MM-DD');
		this.activePreset = 'today';        // mark active
		this.emitRange();
	}

	setYesterday(): void {
		const y = dayjs().subtract(1, 'day');
		this.startDate = y.format('YYYY-MM-DD');
		this.endDate   = y.format('YYYY-MM-DD');
		this.activePreset = 'yesterday';    // mark active
		this.emitRange();
	}

	setThisMonth(): void {
		this.startDate = dayjs().startOf('month').format('YYYY-MM-DD');
		this.endDate   = dayjs().endOf('month').format('YYYY-MM-DD');
		this.activePreset = 'month';        // mark active
		this.emitRange();
	}

	setThisYear(): void {
		this.startDate = dayjs().startOf('year').format('YYYY-MM-DD');
		this.endDate   = dayjs().endOf('year').format('YYYY-MM-DD');
		this.activePreset = 'year';         // mark active
		this.emitRange();
	}

	private emitRange(): void {
		this.rangeChange.emit({ start: this.startDate, end: this.endDate });
	}
}
