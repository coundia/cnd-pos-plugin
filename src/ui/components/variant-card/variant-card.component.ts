// src/extensions/pos-ui/components/variant-card/variant-card.component.ts
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProductVariantFieldsFragment} from '../../graphql/graphql';

@Component({
	selector: 'variant-card',
	standalone: true,
	imports: [CommonModule],  // <-- pour currency pipe
	templateUrl: './variant-card.component.html',
	styleUrls: ['./variant-card.component.scss'],
})
export class VariantCardComponent {
	@Input() variant!: ProductVariantFieldsFragment;
	@Output() add = new EventEmitter<ProductVariantFieldsFragment>();
	@Output() decrease = new EventEmitter<ProductVariantFieldsFragment>();

	onAdd() {
		this.add.emit(this.variant);
	}

	onDecrease() {
		this.decrease.emit(this.variant);
	}
}
