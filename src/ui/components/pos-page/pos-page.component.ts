import {Component, OnInit, signal} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {Apollo} from 'apollo-angular';
import {forkJoin, from, Observable, of, throwError} from 'rxjs';
import {catchError, concatMap, filter, last, map, switchMap, tap} from 'rxjs/operators';

import {DataService, ModalService, NotificationService, SharedModule,} from '@vendure/admin-ui/core';

import {
	GetProductVariantListDocument,
	GetProductVariantListQuery,
	GetProductVariantListQueryVariables,
	ProductVariantFieldsFragment,
	SortOrder,
} from '../../graphql/graphql';

import {VariantCardComponent} from '../variant-card/variant-card.component';
import {PaginationComponent} from '../pagination/pagination.component';
import {CartComponent} from '../cart/cart.component';
import {CustomerPickerModalComponent} from "../customer/customer-picker-modal.component";
import {sendBillingAddress, sendShippingAddress} from "../address-form/address-form.component";

import {
	ADD_ITEM_TO_DRAFT_ORDER,
	ADD_MANUAL_PAYMENT_CONFIRM,
	CREATE_DRAFT_ORDER,
	CUSTOMER_DETAIL_QUERY,
	ORDER_DETAIL_QUERY,
	SET_CUSTOMER_FOR_DRAFT_ORDER,
	TRANSITION_ORDER_STATE,
} from "../../constantes/constantes.graphql";

import {updateShippingMethod} from "../shipping-method-picker/shipping-method-picker.component";
import {hasError} from "../utils/show-graphql-error";
import {loadDefaultCustomer} from "../customer/default-customer";
import {createDefaultFulfillmentForOrder} from "../services/fulfillment.service";
import {PosOrderPrintModalComponent} from "../print/pos-order-print-modal.component";
import {FormControl} from "@angular/forms";
import {parseAmount} from "../utils/parse-amount";

@Component({
	selector: 'pos-page',
	standalone: true,
	imports: [
		SharedModule,
		NgIf, NgForOf,
		VariantCardComponent,
		PaginationComponent,
		CartComponent,
		CustomerPickerModalComponent,
	],
	templateUrl: './pos-page.component.html',
	styleUrls: ['./pos-page.component.scss']
})
export class PosPageComponent implements OnInit {
	variants: ProductVariantFieldsFragment[] = [];
	cartItems: Array<{ productVariant: ProductVariantFieldsFragment; quantity: number }> = [];
	page = 1;
	pageSize = 9;
	totalItems = 0;
	totalPages = 0;
	selectedClient: any;

	validatePayment = signal(false);

	orderId = signal<string | null>(null);
	currentOrderId?: string;
	addressesSaved = false;
	shippingMethodSelected = false;
	paymentAdded = false;

	pickerVisible = false;

	searchControl = new FormControl('');

	amountReceived= '';

	constructor(
		private dataService: DataService,
		private notificationService: NotificationService,
		private apollo: Apollo,
		private modalService: ModalService
	) {}

	ngOnInit(): void {

		this.loadVariants('').subscribe();

		this.searchControl.valueChanges.pipe(
			tap(() => this.page = 1),
			switchMap(value => this.loadVariants(value))
		).subscribe();
	}

	isPaiementDisabled(){
		return !this.currentOrderId  || !this.selectedClient  || this.validatePayment();
	}
	/**
	 * Helper to extract and display GraphQL errors in a consistent way.
	 */
	private showGraphQLError(err: any): void {
		const message = err?.graphQLErrors?.map((e: any) => e.message).join(', ')
			|| err.message
			|| 'Une erreur est survenue';
		this.notificationService.error(message);
		console.error(err);
	}

	onCustomerChosen(client: any) {
		this.selectedClient = client;
		this.pickerVisible = false;

		if (!this.currentOrderId) {
			this.createDraft().subscribe({
				next: draft => {
					this.currentOrderId = draft.data?.createDraftOrder.id;
					this.notificationService.success("Commande initiée.");
					this.updateCustomerDraft();
				},
				error: () => {
					// showGraphQLError already handled
				}
			});
			return;
		}

		this.updateCustomerDraft();
	}

	private loadVariants(searchTerm: any): Observable<any> {
		const skip = (this.page - 1) * this.pageSize;
		const filter = searchTerm
			? { name: { contains: searchTerm } }
			: undefined;

		return this.dataService
			.query<GetProductVariantListQuery, GetProductVariantListQueryVariables>(
				GetProductVariantListDocument,
				{
					options: {
						skip,
						take: this.pageSize,
						filter,
						sort: { updatedAt: SortOrder.Desc },
					},
				}
			)
			.stream$
			.pipe(
				tap(({ productVariants }) => {
					this.totalItems = productVariants.totalItems;
					this.variants = productVariants.items;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
				})
			);
	}

	onPageChange(newPage: number) {
		this.page = newPage;
		this.loadVariants(this.searchControl.value).subscribe();
	}

	selectDefaultCustomer(): void {
		loadDefaultCustomer(this.apollo).pipe(
			map(result => result.data.customers.items),
			filter(items => items.length > 0),
			map(items => items[0].id),
			switchMap(id =>
				this.apollo.query<any>({
					query: CUSTOMER_DETAIL_QUERY,
					variables: {
						id,
						orderListOptions: { sort: { orderPlacedAt: 'DESC' } },
					},
				})
			)
		).subscribe(({ data }) => {
			this.selectedClient = data.customer;
			this.pickerVisible = false;
			hasError<any>(data,'customer',this.notificationService);
		});
	}

	addToCart(variant: ProductVariantFieldsFragment) {

		if (this.validatePayment()){
			this.notificationService.error("Commande déjà validée., créez une nouvelle!");
			return;
		}
		if (!this.currentOrderId) {
			this.createDraft().subscribe({
				next: draft => {
					this.currentOrderId = draft.data?.createDraftOrder.id;
					this.notificationService.success("Commande initiée.");
					this.selectDefaultCustomer();
				},
				error: (err) => {
					this.showGraphQLError(err);
				}
			});
		}

		const existing = this.cartItems.find(i => i.productVariant.id === variant.id);
		if (existing) {
			existing.quantity++;
		} else {
			this.cartItems.push({ productVariant: variant, quantity: 1 });
		}
		this.notificationService.success('Produit ajouté au panier');
	}

	onOrderCreated(order: any) {
		this.currentOrderId = order.id;
		this.notificationService.success(`Commande brouillon créée : ${order.code}`);
	}

	onAddressesSaved() {
		this.addressesSaved = true;
		this.notificationService.info('Adresses enregistrées');
	}

	onShippingMethodSelected() {
		this.shippingMethodSelected = true;
		this.notificationService.info('Méthode de livraison sélectionnée');
	}

	onPaymentAdded() {
		this.paymentAdded = true;
		this.notificationService.info('Paiement enregistré');
	}

	createDraft() {
		return this.apollo
			.mutate<{ createDraftOrder: { id: string; code: string; state: string } }>({
				mutation: CREATE_DRAFT_ORDER,
			})
			.pipe(
				tap((response) => {
					hasError<any>(response,'createDraftOrder',this.notificationService);
					console.debug('[createDraftOrder] Response.data',response?.data)
				}),
				catchError(err => {
					this.showGraphQLError(err);
					return throwError(() => err);
				})
			);
	}

	updateCustomerDraft() {
		this.sendDeps().subscribe({
			next: () => this.notificationService.success("Client sélectionné."),
			error: () => {
				// handled by showGraphQLError
			}
		});
	}

	sendItems(): Observable<any> {
		if (!this.currentOrderId) {
			this.notificationService.error("currentOrderId est vide !");
			return of(null);
		}
		const orderId = this.currentOrderId;
		const ops: Observable<any>[] = [];

		ops.push(
			this.sendDeps()
		)

		// 1) Mise à jour du mode de livraison
		ops.push(
			updateShippingMethod(this.apollo, orderId).pipe(
				tap((response) => {
					hasError<any>(response,'eligibleShippingMethodsForDraftOrder',this.notificationService);
					console.debug('[eligibleShippingMethodsForDraftOrder] Response.data',response?.data)
				}),
				catchError(err => {
					this.showGraphQLError(err);
					return throwError(() => err);
				})
			)
		);

		// 2) Ajout de chaque item
		this.cartItems.forEach((item, idx) => {
			ops.push(
				this.apollo.mutate({
					mutation: ADD_ITEM_TO_DRAFT_ORDER,
					variables: {
						orderId,
						input: {
							productVariantId: item.productVariant.id,
							quantity: item.quantity,
						},
					},
				}).pipe(
					tap((response) => {
						hasError<any>(response,'addItemToDraftOrder',this.notificationService);
						console.debug('[addItemToDraftOrder] Response.data',response?.data)
					}),
					catchError(err => {
						this.showGraphQLError(err);
						return throwError(() => err);
					})
				)
			);
		});

		// 3) ForkJoin et notification
		return forkJoin(ops).pipe(
			tap(() => {
				console.log('[sendItems] 🎉 all operations completed');
				this.notificationService.success('Produits et infos enregistrés.');

			}),
			catchError(err => {
				this.showGraphQLError(err);
				return throwError(() => err);
			})
		);
	}

	sendDeps(): Observable<any> {
		if (!this.currentOrderId) {
			this.notificationService.error("currentOrderId est vide !");
			return of(null);
		}
		const orderId = this.currentOrderId;
		const ops: Observable<any>[] = [
			this.apollo.mutate({
				mutation: SET_CUSTOMER_FOR_DRAFT_ORDER,
				variables: { orderId, customerId: this.selectedClient.id },
			}).pipe(
				catchError(err => {
					this.showGraphQLError(err);
					return throwError(() => err);
				})
			),
			sendShippingAddress(this.apollo, orderId).pipe(
				catchError(err => {
					this.showGraphQLError(err);
					return throwError(() => err);
				})
			),
			sendBillingAddress(this.apollo, orderId).pipe(
				catchError(err => {
					this.showGraphQLError(err);
					return throwError(() => err);
				})
			),
			updateShippingMethod(this.apollo, orderId).pipe(
				catchError(err => {
					this.showGraphQLError(err);
					return throwError(() => err);
				})
			),
		];

		return forkJoin(ops).pipe(
			tap(() => this.notificationService.success('Adresses ajoutées.')),
			catchError(err => {
				this.showGraphQLError(err);
				return throwError(() => err);
			})
		);
	}

	newCommand(){

		this.currentOrderId = undefined;
		this.validatePayment.set(false);
		this.cartItems = [];
		this.selectDefaultCustomer();
		this.amountReceived ='';
	}


	confirmCommand() {
		if (!this.currentOrderId) {
			console.warn('[confirmerCommand] Aucun orderId');
			return;
		}
		const orderId = this.currentOrderId;

		const steps = [
			() => this.sendItems().pipe(
					tap((response) => {
						console.debug('[sendItems] Response.data',response?.data)
					}),
				),

			() =>
				this.apollo.mutate({
					mutation: TRANSITION_ORDER_STATE,
					variables: { id: orderId, state: 'ArrangingPayment' },
				}).pipe(
					tap((response) => {
						hasError<any>(response,'transitionOrderToState',this.notificationService);
						console.debug('[transitionOrderToState] Response.data',response?.data)
					}),
					catchError(err => {
						this.showGraphQLError(err);
						return throwError(() => err);
					})
				),

			() =>
				this.apollo.mutate({
					mutation: ADD_MANUAL_PAYMENT_CONFIRM,
					variables: {
						input: {
							orderId,
							method: 'standard-payment',
							transactionId: 'ok',
							metadata: {
								amount:  this.amountReceived !='' ? parseAmount(this.amountReceived) : this.getTotal() * 100
							},
						},
					},
				}).pipe(
					tap((response) => {
						hasError<any>(response,'addManualPaymentToOrder',this.notificationService);
						console.debug('[addManualPaymentToOrder] Response.data',response?.data)
					}),
					catchError(err => {
						this.showGraphQLError(err);
						return throwError(() => err);
					})
				),

			() => createDefaultFulfillmentForOrder(
				this.apollo, orderId
				).pipe(
				tap((response) => {
					console.debug('[createDefaultFulfillmentForOrder]  ',response)
				}),
			),

		];

		from(steps)
			.pipe(
				concatMap(stepFn => stepFn()),
				last(),
				tap(() => {
					this.validatePayment.set(true);
					this.notificationService.success('Commande validée et paiement ajouté !')
				}),
			)
			.subscribe({
				error: (err) => {
					console.error(err)
				}
			});
	}

	decreaseQuantity(item: { productVariant: ProductVariantFieldsFragment; quantity: number }) {
		if (item.quantity > 1) {
			item.quantity--;
			this.notificationService.info(
				`Quantité de "${item.productVariant.name}" diminuée à ${item.quantity}.`
			);
		} else {
			// remove item
			this.cartItems = this.cartItems.filter(i => i !== item);
			this.notificationService.info(`"${item.productVariant.name}" retiré du panier.`);
		}
	}

	imprimeCommand() {
		if (!this.currentOrderId) {
			alert('Aucune commande à imprimer');
			return;
		}

		this.apollo
			.query({
				query: ORDER_DETAIL_QUERY,
				variables: { id: this.currentOrderId },
			})
			.subscribe(({ data }: any) => {
				console.log(data);
				PosOrderPrintModalComponent.orderData = data.order;
				this.modalService.fromComponent(PosOrderPrintModalComponent).subscribe();
			});
	}

	getTotal(): number {
		return this.cartItems.reduce((sum, i) => {
			const price = i.productVariant.priceWithTax / 100;
			return sum + i.quantity * price;
		}, 0);
	}
}
