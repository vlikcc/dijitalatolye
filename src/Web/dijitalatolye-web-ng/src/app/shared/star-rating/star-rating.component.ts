import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'da-star-rating',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex items-center gap-1" role="radiogroup" [attr.aria-label]="label">
      @for (i of [1,2,3,4,5]; track i) {
        <button type="button"
          (mouseenter)="!readOnly && hover.set(i)"
          (mouseleave)="!readOnly && hover.set(0)"
          (click)="onClick(i)"
          [disabled]="readOnly"
          [attr.aria-label]="i + ' yıldız'"
          [attr.aria-checked]="i <= valueSignal()"
          role="radio"
          class="text-2xl leading-none transition"
          [class.cursor-default]="readOnly"
          [class.text-amber-400]="i <= effectiveValue()"
          [class.text-slate-200]="i > effectiveValue()">
          ★
        </button>
      }
      @if (showValue) {
        <span class="ml-1 text-xs text-slate-500">{{ valueSignal().toFixed(1) }}</span>
      }
    </div>
  `,
})
export class StarRatingComponent {
  @Input() set value(v: number) { this.valueSignal.set(v); }
  @Input() readOnly = false;
  @Input() showValue = false;
  @Input() label = 'Puanlama';
  @Output() valueChange = new EventEmitter<number>();

  readonly valueSignal = signal(0);
  readonly hover = signal(0);
  readonly effectiveValue = computed(() => this.hover() || this.valueSignal());

  onClick(i: number): void {
    if (this.readOnly) return;
    this.valueSignal.set(i);
    this.valueChange.emit(i);
  }
}
