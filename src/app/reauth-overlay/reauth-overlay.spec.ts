import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReauthOverlay } from './reauth-overlay';

describe('ReauthOverlay', () => {
  let component: ReauthOverlay;
  let fixture: ComponentFixture<ReauthOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReauthOverlay],
    }).compileComponents();

    fixture = TestBed.createComponent(ReauthOverlay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
