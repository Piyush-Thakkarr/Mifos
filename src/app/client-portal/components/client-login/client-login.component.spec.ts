import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientLoginComponent } from './client-login.component';

describe('ClientLoginComponent', () => {
  let component: ClientLoginComponent;
  let fixture: ComponentFixture<ClientLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientLoginComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('placeholder', () => {
    // TODO: add tests later
  });
});
