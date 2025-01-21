import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalingComponent } from './signaling.component';

describe('SignalingComponent', () => {
  let component: SignalingComponent;
  let fixture: ComponentFixture<SignalingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignalingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
