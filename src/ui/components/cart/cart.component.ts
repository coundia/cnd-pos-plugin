import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ProductVariantFieldsFragment} from '../../graphql/graphql';
import {NgForOf, NgIf} from '@angular/common';
import {SharedModule} from "@vendure/admin-ui/core";


interface CartItem {
	productVariant: ProductVariantFieldsFragment;
	quantity: number;
}

@Component({
	selector: 'app-cart',
	templateUrl: './cart.component.html',
	standalone: true,
	styleUrls: ['./cart.component.scss'],
	imports: [
		SharedModule,
		NgIf, NgForOf,
	],
})
export class CartComponent {
	@Input() items: CartItem[] = [];
	@Input() validatePayment = false;
	@Output() itemsChange = new EventEmitter<CartItem[]>();

	increase(item: CartItem) {
		if (item.quantity < item.productVariant.stockOnHand) {
			item.quantity++;
			this.emitChange();
		}
	}

	decrease(item: CartItem) {
		if (item.quantity > 1) {
			item.quantity--;
		} else {
			// on supprime la ligne
			this.items = this.items.filter(i => i !== item);
		}
		this.emitChange();
	}

	remove(item: CartItem) {
		this.items = this.items.filter(i => i !== item);
		this.emitChange();
	}

	clearCart() {
		this.items = [];
		this.emitChange();
	}

	getTotal(): number {
		return this.items.reduce((sum, i) => {
			const price = i.productVariant.priceWithTax / 100;
			return sum + i.quantity * price;
		}, 0);
	}

	private emitChange() {
		this.itemsChange.emit(this.items);
	}
}
