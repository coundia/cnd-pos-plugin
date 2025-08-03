import {Component, EventEmitter, Input, Output} from '@angular/core';

import {NgForOf} from "@angular/common";

@Component({
	selector: 'app-pagination',
	standalone: true,
	templateUrl: './pagination.component.html',
	imports: [
		 NgForOf,
	],
})
export class PaginationComponent {
	@Input() currentPage = 1;
	@Input() totalPages = 1;
	@Output() pageChange = new EventEmitter<number>();

	selectPage(p: number) {
		if (p < 1 || p > this.totalPages) return;
		this.pageChange.emit(p);
	}
}
