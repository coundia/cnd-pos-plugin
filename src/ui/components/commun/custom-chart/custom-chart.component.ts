import {Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, OnInit} from '@angular/core';
import {SharedModule} from "@vendure/admin-ui/core";
 import {ChartComponent} from "@vendure/admin-ui/core";
import {ChartEntry} from "../../transactions/constantes/chart";

@Component({
	selector: 'vdr-custom-chart',
	templateUrl: './custom-chart.component.html',
	styleUrls: ['./custom-chart.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SharedModule],
	standalone: true,
})


export class CustomChartComponent extends ChartComponent  implements OnInit {
	@Input() myEntries: ChartEntry[] = [];
	@Input() myOptions = {};
	@ViewChild('chartDiv', { static: true })
	private myChartDivRef: ElementRef<HTMLDivElement>;

	ngOnInit() {
		this.options= {...this.options,...this.myOptions}
 		super.ngOnInit();
 	}

}
