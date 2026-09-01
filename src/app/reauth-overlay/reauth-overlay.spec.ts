import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReauthOverlayComponent } from './reauth-overlay';

describe('ReauthOverlay', () => {
  let component: ReauthOverlayComponent;
  let fixture: ComponentFixture<ReauthOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReauthOverlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReauthOverlayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
