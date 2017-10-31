import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoamCompComponent } from './noam-comp.component';

describe('NoamCompComponent', () => {
  let component: NoamCompComponent;
  let fixture: ComponentFixture<NoamCompComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoamCompComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoamCompComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
