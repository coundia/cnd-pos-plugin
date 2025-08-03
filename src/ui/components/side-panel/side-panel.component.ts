import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SharedModule } from '@vendure/admin-ui/core';

@Component({
	selector: 'app-side-panel',
	standalone: true,
	imports: [SharedModule],
	host: {
		'clrModalHost': ''
	},
	templateUrl: './side-panel.component.html',
})
export class SidePanelComponent {
	@Input() clrSidePanelBackdrop = true;
	@Input() clrSidePanelPinnable = false;
	@Input() clrSidePanelStaticBackdrop = false;
	@Input() clrSidePanelCloseButtonAriaLabel = 'Close';
	@Input() clrSidePanelLabelledById?: string;
	@Input() clrSidePanelSize: 'sm' | 'md' | 'lg' = 'md';
	@Input() clrSidePanelSkipAnimation = false;
	@Input() clrSidePanelPreventClose = false;

	private _open = false;
	@Input()
	get clrSidePanelOpen(): boolean { return this._open; }
	set clrSidePanelOpen(value: boolean) {
		this._open = value;
		this.clrSidePanelOpenChange.emit(value);
	}
	@Output() clrSidePanelOpenChange = new EventEmitter<boolean>();

	@Output() clrSidePanelAlternateClose = new EventEmitter<void>();
}
