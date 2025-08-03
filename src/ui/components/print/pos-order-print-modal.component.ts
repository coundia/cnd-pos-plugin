import {Component, ElementRef, ViewChild} from '@angular/core';
import {Dialog, SharedModule} from '@vendure/admin-ui/core';
import {PDFDocument} from 'pdf-lib';
import {toPng} from 'html-to-image';


@Component({
	selector: 'order-print-modal',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './pos-order-print-modal.component.html',
	styleUrls: ['./pos-order-print-modal.component.scss']
})
export class PosOrderPrintModalComponent implements Dialog<void> {
	static orderData: any; // Propriété statique globale
	resolveWith: (result?: void) => void;
	order = PosOrderPrintModalComponent.orderData;

	@ViewChild('printContent', { static: true }) contentRef!: ElementRef;

	async printPdf() {
		if (!this.contentRef || !this.contentRef.nativeElement) {
			alert('Printable content not available.');
			return;
		}
		const node = this.contentRef.nativeElement;
		const pngDataUrl = await toPng(node);
		const pdfDoc = await PDFDocument.create();
		const page = pdfDoc.addPage();

		const pngImage = await pdfDoc.embedPng(pngDataUrl);
		const { width, height } = pngImage.scale(0.5);
		page.setSize(width, height);
		page.drawImage(pngImage, { x: 0, y: 0, width, height });

		const pdfBytes = await pdfDoc.save();
		const blob = new Blob([pdfBytes], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `order-${this.order.code}.pdf`;
		a.click();
		URL.revokeObjectURL(url);

		this.resolveWith();
	}

	close() {
		this.resolveWith();
	}
}
