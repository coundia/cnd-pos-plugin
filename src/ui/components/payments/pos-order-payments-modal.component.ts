import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Dialog, NotificationService, SharedModule} from '@vendure/admin-ui/core';
import {CommonModule} from '@angular/common';
import {ADD_MANUAL_PAYMENT_CONFIRM, GET_ORDER_WITH_PAYMENTS} from "../../constantes/constantes.graphql";
import {FormControl, Validators} from '@angular/forms';
import {Apollo} from "apollo-angular";
import {parseAmount} from "../utils/parse-amount";
import {toPng} from "html-to-image";
import {PDFDocument} from 'pdf-lib';


@Component({
	selector: 'pos-order-payments-modal',
	standalone: true,
	imports: [SharedModule, CommonModule],
	templateUrl: './pos-order-payments-modal.component.html',
	styleUrls: ['./pos-order-payments-modal.component.scss'],
})
export class PosOrderPaymentsModalComponent implements Dialog<void>, OnInit {
	static orderData: any;
	order = PosOrderPaymentsModalComponent.orderData;
	resolveWith: (result?: void) => void;

	@ViewChild('paymentsContent', { static: true }) paymentsContent!: ElementRef;


	amountControl = new FormControl<number | null>(null,
		[Validators.required, Validators.min(0.01)]);

	constructor(
		private apollo: Apollo,
		private notificationService: NotificationService,
	) {}

	ngOnInit(): void {
		this.loadPayments();
	}


	addPayment() {
		let amount = this.amountControl.value;
		const orderId = this.order.id;

		if (!amount || amount <= 0) {
			this.notificationService.error('Montant invalide', {
				duration: 4000,
			});
			return;
		}

		this.apollo.mutate({
			mutation: ADD_MANUAL_PAYMENT_CONFIRM,
			variables: {
				input: {
					orderId,
					method: 'standard-payment',
					transactionId: 'POS',
					metadata: {
						amount: parseAmount(amount),
						note: 'Ajout manuel depuis POS',
					},
				},
			},
		}).subscribe({
			next: (res: any) => {
				const result = res?.data?.addManualPaymentToOrder;

				if (result?.id) {
					this.notificationService.success(
						`Paiement de ${(amount / 100).toFixed(2)} ajouté avec succès`,
						{ duration: 3000 }
					);
					this.order = { ...this.order, payments: result.payments };
					this.amountControl.reset();
					this.loadPayments(); // 🔄 recharge à jour
				} else {
					this.notificationService.error(
						result?.message || 'Une erreur est survenue',
						{ duration: 5000 }
					);
				}
			},
			error: err => {
				this.notificationService.error(
					err?.message || 'Erreur serveur inattendue',
					{ duration: 5000 }
				);
			},
		});
	}


	close() {
		this.resolveWith();
	}

	loadPayments() {
		this.apollo.query({
			query: GET_ORDER_WITH_PAYMENTS,
			variables: { id: this.order.id },
			fetchPolicy: 'no-cache'
		}).subscribe({
			next: (res: any) => {
				const updated = res?.data?.order;
				console.log(updated);
				if (updated) {
					updated.payments = [...updated.payments].sort((a, b) => {
						return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
					});

					this.order = { ...this.order, payments: updated.payments };
				}
			},
			error: err => {
				this.notificationService.error('Erreur chargement paiements', err.message);
			}
		});

	}

	get totalPaid(): number {
		return (this.order?.payments || []).reduce((sum: any, p: { amount: any; }) => sum + (p.amount || 0), 0);
	}

	get totalToPay(): number {
		return this.order?.totalWithTax || 0;
	}

	get remainingToPay(): number {
		return Math.max(this.totalToPay - this.totalPaid);
	}

	async printPaymentsPdf(): Promise<void> {
		const node = this.paymentsContent.nativeElement;
		const png = await toPng(node);
		const pdfDoc = await PDFDocument.create();
		const page = pdfDoc.addPage();
		const img = await pdfDoc.embedPng(png);
		// 1 = taille originale, 1.5 = 150 %, 2 = 200 %, etc.
		const scale = 1;
		const { width, height } = img.scale(scale);
		page.setSize(width, height);
		page.drawImage(img, { x: 0, y: 0, width, height });
		const bytes = await pdfDoc.save();
		const blob = new Blob([bytes], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `paiements-${this.order.code}.pdf`;
		a.click();
		URL.revokeObjectURL(url);
		this.resolveWith();
	}



}